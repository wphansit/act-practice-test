"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { th } from "@/lib/i18n/th";

export default function AdminLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.status === 429) {
        setError(th.admin.login.locked);
      } else if (!res.ok) {
        setError(th.admin.login.wrong);
      } else {
        router.replace("/admin");
        return;
      }
    } catch {
      setError(th.admin.common.error);
    }
    setBusy(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={login}
        className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-8"
      >
        <h1 className="text-xl font-bold text-slate-900">🔐 {th.admin.login.title}</h1>
        <label htmlFor="passcode" className="mt-5 block text-sm font-semibold text-slate-700">
          {th.admin.login.password}
        </label>
        <input
          id="passcode"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          autoFocus
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={!passcode || busy}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-white font-semibold hover:bg-slate-700 disabled:opacity-40 transition-colors"
        >
          {busy ? th.admin.common.loading : th.admin.login.submit}
        </button>
      </form>
    </main>
  );
}
