"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { choiceLetter } from "@/lib/exam/definition";
import type { SectionRunnerPayload } from "@/lib/exam/payload";
import { th } from "@/lib/i18n/th";
import { renderMdInline } from "@/lib/md";
import { ChoiceGroup } from "./ChoiceGroup";
import { PassagePane } from "./PassagePane";
import { QuestionPalette } from "./QuestionPalette";
import { SubmitDialog } from "./SubmitDialog";
import { Timer } from "./Timer";
import { useAutosave, type AnswerState } from "./useAutosave";

export function SectionRunner({ payload }: { payload: SectionRunnerPayload }) {
  const router = useRouter();
  const { attemptId, section, questions, passages } = payload;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>(() => {
    const initial: Record<number, AnswerState> = {};
    for (const r of payload.responses) {
      initial[r.questionId] = { selectedIndex: r.selectedIndex, isFlagged: r.isFlagged };
    }
    return initial;
  });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expired, setExpired] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittingRef = useRef(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const tabId = useRef<string>("");

  const current = questions[index];
  const currentAnswer = answers[current.id] ?? { selectedIndex: null, isFlagged: false };
  const passage = useMemo(
    () => passages.find((p) => p.id === current.passageId) ?? null,
    [passages, current.passageId],
  );
  const answeredCount = questions.filter(
    (q) => answers[q.id]?.selectedIndex !== null && answers[q.id]?.selectedIndex !== undefined,
  ).length;
  const flaggedCount = questions.filter((q) => answers[q.id]?.isFlagged).length;
  const isLast = index === questions.length - 1;

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // ---------- submit ----------
  const submitSection = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    await flushRef.current();
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(
          `/api/attempts/${attemptId}/sections/${section.code}/submit`,
          { method: "POST", keepalive: true },
        );
        if (res.ok) {
          const data = (await res.json()) as {
            attemptCompleted: boolean;
            nextSectionPosition: number | null;
          };
          if (data.attemptCompleted || data.nextSectionPosition === null) {
            router.replace(`/results/${attemptId}`);
          } else {
            router.replace(`/test/${attemptId}/instructions/${data.nextSectionPosition}`);
          }
          return;
        }
        if (res.status === 409) {
          router.replace(`/test/${attemptId}`);
          return;
        }
      } catch {
        // network error — retry below
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
    submittingRef.current = false;
    setSubmitting(false);
    showToast(th.admin.common.error + " — " + th.admin.common.retry);
  }, [attemptId, section.code, router, showToast]);

  // ---------- autosave ----------
  const onSectionClosed = useCallback(() => {
    // Server says time is up — mirror the timeout flow.
    setExpired(true);
    setTimeout(() => void submitSection(), 1500);
  }, [submitSection]);

  const { save, flush, status: saveStatus } = useAutosave(attemptId, onSectionClosed);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  const updateAnswer = useCallback(
    (questionId: number, value: AnswerState) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      save(questionId, value);
    },
    [save],
  );

  const selectChoice = useCallback(
    (choiceIndex: number | null) => {
      if (expired || blocked || submitting) return;
      updateAnswer(current.id, { ...currentAnswer, selectedIndex: choiceIndex });
    },
    [current.id, currentAnswer, updateAnswer, expired, blocked, submitting],
  );

  const toggleFlag = useCallback(() => {
    if (expired || blocked || submitting) return;
    updateAnswer(current.id, { ...currentAnswer, isFlagged: !currentAnswer.isFlagged });
  }, [current.id, currentAnswer, updateAnswer, expired, blocked, submitting]);

  // ---------- timer ----------
  const onExpire = useCallback(() => {
    setExpired(true);
    setDialogOpen(false);
    setPaletteOpen(false);
    setTimeout(() => void submitSection(), 1500);
  }, [submitSection]);

  const onWarn = useCallback(
    (minutes: 5 | 1) => {
      showToast(minutes === 5 ? th.runner.fiveMinWarning : th.runner.oneMinWarning);
    },
    [showToast],
  );

  // ---------- two-tab guard ----------
  useEffect(() => {
    tabId.current = crypto.randomUUID();
    const channel = new BroadcastChannel(`act-attempt-${attemptId}`);
    channelRef.current = channel;
    channel.onmessage = (e: MessageEvent) => {
      if (e.data?.type === "claim" && e.data.tab !== tabId.current) setBlocked(true);
    };
    channel.postMessage({ type: "claim", tab: tabId.current });
    return () => channel.close();
  }, [attemptId]);

  const reclaimTab = useCallback(() => {
    channelRef.current?.postMessage({ type: "claim", tab: tabId.current });
    setBlocked(false);
  }, []);

  // ---------- keyboard ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (blocked || expired || submitting || dialogOpen) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft" && index > 0) {
        setIndex(index - 1);
      } else if (e.key === "ArrowRight" && !isLast) {
        setIndex(index + 1);
      } else if (e.key === "f" || e.key === "F") {
        toggleFlag();
      } else if (e.key === "Enter" && isLast && !paletteOpen) {
        setDialogOpen(true);
      } else {
        // digits 1..n or the current question's ACT letters
        const digit = Number(e.key);
        if (Number.isInteger(digit) && digit >= 1 && digit <= current.choices.length) {
          selectChoice(digit - 1);
          return;
        }
        const upper = e.key.toUpperCase();
        for (let i = 0; i < current.choices.length; i++) {
          if (choiceLetter(current.position, i) === upper) {
            selectChoice(i);
            return;
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    blocked,
    expired,
    submitting,
    dialogOpen,
    paletteOpen,
    index,
    isLast,
    current,
    selectChoice,
    toggleFlag,
  ]);

  const saveLabel =
    saveStatus === "saved"
      ? th.runner.saved
      : saveStatus === "saving"
        ? th.runner.saving
        : th.runner.saveError;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* header */}
      <header className="shrink-0 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-bold text-slate-900">{section.nameEn}</span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            {th.instructions.partOf(section.position)}
          </span>
          <span className="text-sm text-slate-600 tabular-nums">
            {th.runner.questionOf(current.position, section.questionCount)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Timer
            deadlineAt={payload.deadlineAt}
            serverNow={payload.serverNow}
            onExpire={onExpire}
            onWarn={onWarn}
          />
          <button
            onClick={toggleFlag}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              currentAnswer.isFlagged
                ? "border-orange-400 bg-orange-50 text-orange-700"
                : "border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
            aria-pressed={currentAnswer.isFlagged}
          >
            🏳 {currentAnswer.isFlagged ? th.runner.unflag : th.runner.flag}
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            ☰ {th.runner.allQuestions}
            {answeredCount < section.questionCount && (
              <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs tabular-nums">
                {section.questionCount - answeredCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* main area */}
      <div className="flex-1 flex overflow-hidden">
        {passage && (
          <div className="w-[55%] border-r border-slate-200 hidden md:block">
            <PassagePane
              passage={passage}
              activePosition={section.code === "english" ? current.position : null}
            />
          </div>
        )}
        <main
          className={`flex-1 overflow-y-auto px-6 py-6 ${!passage ? "flex justify-center" : ""}`}
        >
          <div className={passage ? "" : "w-full max-w-2xl"}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-bold tabular-nums">
                {current.position}
              </span>
              <div
                className="act-serif act-content text-slate-900 flex-1"
                dangerouslySetInnerHTML={{ __html: renderMdInline(current.stemMd) }}
              />
            </div>
            <div className="mt-5">
              <ChoiceGroup
                choices={current.choices}
                selectedIndex={currentAnswer.selectedIndex}
                questionPosition={current.position}
                onSelect={selectChoice}
                disabled={expired || blocked || submitting}
              />
            </div>
          </div>
        </main>
      </div>

      {/* footer */}
      <footer className="shrink-0 flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
        <button
          onClick={() => setIndex(index - 1)}
          disabled={index === 0 || submitting}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {th.runner.prev}
        </button>
        <span
          className={`text-xs ${saveStatus === "error" ? "text-red-600 font-semibold" : "text-slate-400"}`}
          aria-live="polite"
        >
          {saveLabel}
        </span>
        {isLast ? (
          <button
            onClick={() => setDialogOpen(true)}
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {th.runner.submitSection}
          </button>
        ) : (
          <button
            onClick={() => setIndex(index + 1)}
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {th.runner.next}
          </button>
        )}
      </footer>

      {/* overlays */}
      <QuestionPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        questions={questions}
        passages={passages}
        answers={answers}
        currentIndex={index}
        onJump={setIndex}
      />
      <SubmitDialog
        open={dialogOpen}
        sectionName={section.nameEn}
        answered={answeredCount}
        total={section.questionCount}
        flagged={flaggedCount}
        busy={submitting}
        onCancel={() => setDialogOpen(false)}
        onConfirm={() => void submitSection()}
      />
      {expired && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70">
          <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-xl">
            <p className="text-2xl">⏰</p>
            <p className="mt-2 font-semibold text-slate-900">{th.runner.timeUp}</p>
          </div>
        </div>
      )}
      {blocked && !expired && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80">
          <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-xl max-w-sm">
            <p className="text-2xl">🗂️</p>
            <p className="mt-2 font-semibold text-slate-900">{th.runner.otherTab}</p>
            <button
              onClick={reclaimTab}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {th.runner.useThisTab}
            </button>
          </div>
        </div>
      )}
      {toast && (
        <div
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[80] rounded-full bg-slate-900 px-5 py-2.5 text-sm text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
