"use client";

import { useEffect, useRef } from "react";
import { th } from "@/lib/i18n/th";

export function SubmitDialog({
  open,
  sectionName,
  answered,
  total,
  flagged,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  sectionName: string;
  answered: number;
  total: number;
  flagged: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;
  const allAnswered = answered === total;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label={th.runner.submitDialog.title(sectionName)}
    >
      <div className="absolute inset-0 bg-slate-900/40" onClick={busy ? undefined : onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">
          {th.runner.submitDialog.title(sectionName)}
        </h2>
        <p
          className={`mt-3 rounded-lg px-3 py-2.5 text-sm ${
            allAnswered
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-slate-50 text-slate-700 border border-slate-200"
          }`}
        >
          {allAnswered ? "✓ " + th.runner.submitDialog.allAnswered + " · " : ""}
          {th.runner.submitDialog.stats(answered, total, flagged)}
        </p>
        <p className="mt-2 text-sm text-red-600">⚠ {th.runner.submitDialog.warning}</p>
        <div className="mt-5 flex gap-3 justify-end">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {th.runner.submitDialog.review}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {busy ? th.admin.common.loading : th.runner.submitDialog.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
