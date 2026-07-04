"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { th } from "@/lib/i18n/th";

export function StartForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: name.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { attemptId } = (await res.json()) as { attemptId: string };
      router.push(`/test/${attemptId}`);
    } catch {
      setError(th.admin.common.error);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={start} className="mt-6">
      <label htmlFor="studentName" className="block text-sm font-semibold text-slate-700">
        {th.landing.nameLabel}
      </label>
      <input
        id="studentName"
        type="text"
        value={name}
        maxLength={50}
        onChange={(e) => setName(e.target.value)}
        placeholder={th.landing.namePlaceholder}
        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        autoComplete="off"
        autoFocus
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!name.trim() || busy}
        className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 text-white font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-colors"
      >
        {busy ? th.landing.starting : th.landing.start}
      </button>
    </form>
  );
}
