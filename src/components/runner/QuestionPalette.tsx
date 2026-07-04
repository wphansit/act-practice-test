"use client";

import { useEffect } from "react";
import type { ClientPassage, ClientQuestion } from "@/lib/exam/payload";
import { th } from "@/lib/i18n/th";
import { romanNumeral } from "./PassagePane";

export interface PaletteAnswerState {
  selectedIndex: number | null;
  isFlagged: boolean;
}

/** Right slide-over grid of question tiles, grouped by passage. */
export function QuestionPalette({
  open,
  onClose,
  questions,
  passages,
  answers,
  currentIndex,
  onJump,
}: {
  open: boolean;
  onClose: () => void;
  questions: ClientQuestion[];
  passages: ClientPassage[];
  answers: Record<number, PaletteAnswerState>;
  currentIndex: number;
  onJump: (index: number) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Group question indexes by passage (single flat group for Math).
  const groups: Array<{ label: string | null; indexes: number[] }> = [];
  if (passages.length === 0) {
    groups.push({ label: null, indexes: questions.map((_, i) => i) });
  } else {
    const byPassage = new Map<number | null, number[]>();
    questions.forEach((q, i) => {
      const list = byPassage.get(q.passageId) ?? [];
      list.push(i);
      byPassage.set(q.passageId, list);
    });
    for (const p of passages) {
      const indexes = byPassage.get(p.id);
      if (indexes) groups.push({ label: `Passage ${romanNumeral(p.position)}`, indexes });
    }
    const orphans = byPassage.get(null);
    if (orphans) groups.push({ label: null, indexes: orphans });
  }

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-label={th.runner.allQuestions}>
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-800">{th.runner.allQuestions}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none px-1 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            aria-label="ปิด"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {groups.map((g, gi) => (
            <div key={gi} className="mb-4">
              {g.label && (
                <p className="text-xs font-semibold text-slate-400 tracking-wide mb-1.5">
                  {g.label}
                </p>
              )}
              <div className="grid grid-cols-8 gap-1.5">
                {g.indexes.map((i) => {
                  const q = questions[i];
                  const a = answers[q.id];
                  const answered = a?.selectedIndex !== null && a?.selectedIndex !== undefined;
                  const flagged = a?.isFlagged ?? false;
                  const current = i === currentIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        onJump(i);
                        onClose();
                      }}
                      className={`relative h-8 rounded text-xs font-semibold tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        answered
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                      } ${current ? "ring-2 ring-indigo-600 ring-offset-1" : ""}`}
                      aria-label={`ข้อ ${q.position}${answered ? " ตอบแล้ว" : ""}${flagged ? " ปักธง" : ""}`}
                    >
                      {q.position}
                      {flagged && (
                        <span className="absolute -top-0.5 -right-0.5 h-0 w-0 border-t-8 border-l-8 border-t-orange-500 border-l-transparent rotate-90" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 space-y-1">
          <p>
            <span className="inline-block h-3 w-3 rounded bg-indigo-600 align-middle mr-1.5" />
            {th.runner.paletteLegend.answered}
            <span className="inline-block h-3 w-3 rounded border border-slate-300 bg-white align-middle ml-3 mr-1.5" />
            {th.runner.paletteLegend.unanswered}
          </p>
          <p>
            <span className="inline-block h-0 w-0 border-t-8 border-l-8 border-t-orange-500 border-l-transparent rotate-90 align-middle mr-1.5" />
            {th.runner.paletteLegend.flagged}
            <span className="inline-block h-3 w-3 rounded ring-2 ring-indigo-600 ring-offset-1 bg-white align-middle ml-3 mr-1.5" />
            {th.runner.paletteLegend.current}
          </p>
        </div>
      </div>
    </div>
  );
}
