"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { th } from "@/lib/i18n/th";

export function StartSectionButton({
  attemptId,
  code,
  position,
  label,
}: {
  attemptId: string;
  code: string;
  position: number;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/sections/${code}/start`, {
        method: "POST",
      });
      if (res.status === 409) {
        // out of order / already submitted — let the dispatcher sort it out
        router.replace(`/test/${attemptId}`);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.replace(`/test/${attemptId}/section/${position}`);
    } catch {
      setError(th.admin.common.error);
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      {error && <p className="mb-2 text-sm text-red-600 text-center">{error}</p>}
      <button
        onClick={start}
        disabled={busy}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3.5 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-colors"
      >
        {busy ? th.admin.common.loading : `▶ ${label}`}
      </button>
    </div>
  );
}
