"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SECTIONS, type SectionCode } from "@/lib/exam/definition";
import { th } from "@/lib/i18n/th";

const PASSAGE_SECTIONS: SectionCode[] = ["english", "reading", "science"];

const KINDS: Record<string, string[]> = {
  english: [],
  reading: ["prose_fiction", "social_science", "humanities", "natural_science"],
  science: ["data_representation", "research_summary", "conflicting_viewpoints"],
};

export interface PassageFormValues {
  section_code: SectionCode;
  position: number;
  title: string;
  body_md: string;
  kind: string | null;
}

export function PassageForm({
  passageId,
  initial,
}: {
  passageId?: number;
  initial?: PassageFormValues;
}) {
  const router = useRouter();
  const editing = passageId !== undefined;
  const [values, setValues] = useState<PassageFormValues>(
    initial ?? { section_code: "reading", position: 1, title: "", body_md: "", kind: null },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(
        editing ? `/api/admin/passages/${passageId}` : "/api/admin/passages",
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
      if (!editing) router.replace("/admin/passages");
      else router.refresh();
    } catch {
      setError(th.admin.common.error);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
  const label = "block text-sm font-semibold text-slate-700";
  const kinds = KINDS[values.section_code] ?? [];

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <label className={label}>
          {th.admin.editor.section}
          <select
            value={values.section_code}
            disabled={editing}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                section_code: e.target.value as SectionCode,
                kind: null,
              }))
            }
            className={`${input} disabled:bg-slate-100 disabled:text-slate-500`}
          >
            {PASSAGE_SECTIONS.map((code) => (
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
            value={values.position}
            onChange={(e) => setValues((v) => ({ ...v, position: Number(e.target.value) }))}
            className={input}
            required
          />
        </label>
        <label className={label}>
          {th.admin.passages.kind}
          <select
            value={values.kind ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, kind: e.target.value || null }))}
            className={input}
          >
            <option value="">—</option>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={label}>
        {th.admin.passages.title}
        <input
          type="text"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          className={input}
          required
        />
      </label>

      <label className={label}>
        {th.admin.passages.body}
        <span className="block font-normal text-xs text-slate-400">
          {values.section_code === "english" ? th.admin.passages.underlineNote : "Markdown"}
        </span>
        <textarea
          value={values.body_md}
          onChange={(e) => setValues((v) => ({ ...v, body_md: e.target.value }))}
          rows={16}
          className={`${input} font-mono text-[13px]`}
          required
        />
      </label>

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
          onClick={() => router.push("/admin/passages")}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {th.admin.editor.cancel}
        </button>
      </div>
    </form>
  );
}
