"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SECTIONS, SECTION_ORDER, type SectionCode } from "@/lib/exam/definition";
import { th } from "@/lib/i18n/th";

export interface PassageOption {
  id: number;
  section_code: SectionCode;
  title: string;
}

export interface QuestionFormValues {
  section_code: SectionCode;
  passage_id: number | null;
  position: number;
  stem_md: string;
  choices: string[];
  correct_index: number;
  explanation_md: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

export function QuestionForm({
  questionId,
  initial,
  passages,
  topics,
}: {
  questionId?: number;
  initial?: QuestionFormValues;
  passages: PassageOption[];
  topics: string[];
}) {
  const router = useRouter();
  const editing = questionId !== undefined;
  const [values, setValues] = useState<QuestionFormValues>(
    initial ?? {
      section_code: "english",
      passage_id: null,
      position: 1,
      stem_md: "",
      choices: ["", "", "", ""],
      correct_index: 0,
      explanation_md: "",
      difficulty: "medium",
      topic: "",
    },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const def = SECTIONS[values.section_code];
  const sectionPassages = useMemo(
    () => passages.filter((p) => p.section_code === values.section_code),
    [passages, values.section_code],
  );

  function setSection(code: SectionCode) {
    const choiceCount = SECTIONS[code].choiceCount;
    setValues((v) => ({
      ...v,
      section_code: code,
      passage_id: code === "math" ? null : v.passage_id,
      choices:
        v.choices.length === choiceCount
          ? v.choices
          : [...v.choices, "", "", "", "", ""].slice(0, choiceCount),
      correct_index: Math.min(v.correct_index, choiceCount - 1),
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(
        editing ? `/api/admin/questions/${questionId}` : "/api/admin/questions",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        issues?: Array<{ message: string }>;
      };
      if (!res.ok) {
        setError(data.issues?.map((i) => i.message).join(" · ") ?? th.admin.common.error);
        return;
      }
      setSaved(true);
      if (!editing) {
        router.replace("/admin/questions");
      } else {
        router.refresh();
      }
    } catch {
      setError(th.admin.common.error);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
  const label = "block text-sm font-semibold text-slate-700";

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <label className={label}>
          {th.admin.editor.section}
          <select
            value={values.section_code}
            disabled={editing}
            onChange={(e) => setSection(e.target.value as SectionCode)}
            className={`${input} disabled:bg-slate-100 disabled:text-slate-500`}
          >
            {SECTION_ORDER.map((code) => (
              <option key={code} value={code}>
                {SECTIONS[code].nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {th.admin.editor.position}
          <input
            type="number"
            min={1}
            max={def.questionCount}
            value={values.position}
            onChange={(e) => setValues((v) => ({ ...v, position: Number(e.target.value) }))}
            className={input}
            required
          />
        </label>
      </div>

      {values.section_code !== "math" && (
        <label className={label}>
          {th.admin.editor.passage}
          <select
            value={values.passage_id ?? ""}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                passage_id: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className={input}
            required
          >
            <option value="">—</option>
            {sectionPassages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className={label}>
        {th.admin.editor.stem}
        <textarea
          value={values.stem_md}
          onChange={(e) => setValues((v) => ({ ...v, stem_md: e.target.value }))}
          rows={3}
          className={`${input} font-mono text-[13px]`}
          required
        />
      </label>

      <fieldset>
        <legend className={label}>
          {th.admin.editor.choices}{" "}
          <span className="font-normal text-xs text-slate-400">({th.admin.editor.lettersNote})</span>
        </legend>
        <div className="mt-1 space-y-2">
          {values.choices.map((choice, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={values.correct_index === i}
                onChange={() => setValues((v) => ({ ...v, correct_index: i }))}
                className="h-4 w-4 accent-indigo-600"
                title={th.admin.editor.correct}
              />
              <span className="w-5 text-sm font-bold text-slate-500">
                {String.fromCharCode(65 + i)}
              </span>
              <input
                type="text"
                value={choice}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    choices: v.choices.map((c, j) => (j === i ? e.target.value : c)),
                  }))
                }
                className={`${input} mt-0 font-mono text-[13px]`}
                required
              />
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-400">◉ = {th.admin.editor.correct}</p>
      </fieldset>

      <label className={label}>
        {th.admin.editor.explanation}
        <textarea
          value={values.explanation_md}
          onChange={(e) => setValues((v) => ({ ...v, explanation_md: e.target.value }))}
          rows={3}
          className={`${input} font-mono text-[13px]`}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className={label}>
          {th.admin.editor.topic}
          <input
            type="text"
            list="topics"
            value={values.topic}
            onChange={(e) => setValues((v) => ({ ...v, topic: e.target.value }))}
            className={input}
            required
          />
          <datalist id="topics">
            {topics.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
        <label className={label}>
          {th.admin.editor.difficulty}
          <select
            value={values.difficulty}
            onChange={(e) =>
              setValues((v) => ({ ...v, difficulty: e.target.value as QuestionFormValues["difficulty"] }))
            }
            className={input}
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">✓ {th.admin.editor.saved}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? th.admin.common.loading : th.admin.editor.save}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/questions")}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {th.admin.editor.cancel}
        </button>
      </div>
    </form>
  );
}
