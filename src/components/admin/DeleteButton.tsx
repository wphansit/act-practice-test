"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { th } from "@/lib/i18n/th";

/**
 * Generic destructive-action button: native confirm, DELETE request, then
 * either navigate away or refresh the current server-component page.
 */
export function DeleteButton({
  url,
  confirmText,
  label = th.admin.questions.del,
  redirectTo,
  className,
}: {
  url: string;
  confirmText: string;
  label?: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    if (!window.confirm(confirmText) || busy) return;
    setBusy(true);
    try {
      const res = await fetch(url, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        outcome?: string;
      };
      if (res.status === 409 && data.error === "PASSAGE_HAS_QUESTIONS") {
        setMessage(th.admin.passages.deleteBlocked);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      if (data.outcome === "deactivated") {
        window.alert(th.admin.questions.deleteBlocked);
      }
      if (redirectTo) router.replace(redirectTo);
      else router.refresh();
    } catch {
      setMessage(th.admin.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={run}
        disabled={busy}
        className={
          className ??
          "text-sm text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
        }
      >
        {label}
      </button>
      {message && <span className="text-xs text-red-600">{message}</span>}
    </span>
  );
}
