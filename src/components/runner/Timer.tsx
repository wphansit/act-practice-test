"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { th } from "@/lib/i18n/th";

function format(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Counts down to the server-issued deadline. The remaining time is recomputed
 * from the wall clock every tick (no drift), corrected by the server clock
 * offset measured from the payload's serverNow.
 */
export function Timer({
  deadlineAt,
  serverNow,
  onExpire,
  onWarn,
}: {
  deadlineAt: string;
  serverNow: string;
  onExpire: () => void;
  onWarn: (minutes: 5 | 1) => void;
}) {
  // Offset is measured once from the initial payload; re-renders keep it.
  const offset = useMemo(() => Date.parse(serverNow) - Date.now(), [serverNow]);
  const [remaining, setRemaining] = useState(
    () => Date.parse(deadlineAt) - (Date.now() + offset),
  );
  const [hidden, setHidden] = useState(false);
  const fired = useRef({ five: false, one: false, expired: false });

  useEffect(() => {
    const tick = () => {
      const rem = Date.parse(deadlineAt) - (Date.now() + offset);
      setRemaining(rem);
      if (rem <= 300_000 && rem > 0 && !fired.current.five) {
        fired.current.five = true;
        onWarn(5);
      }
      if (rem <= 60_000 && rem > 0 && !fired.current.one) {
        fired.current.one = true;
        onWarn(1);
      }
      if (rem <= 0 && !fired.current.expired) {
        fired.current.expired = true;
        onExpire();
      }
    };
    const interval = setInterval(tick, 250);
    tick();
    return () => clearInterval(interval);
  }, [deadlineAt, offset, onExpire, onWarn]);

  const danger = remaining <= 60_000;
  const warning = !danger && remaining <= 300_000;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono tabular-nums text-sm font-semibold ${
          danger
            ? "bg-red-600 text-white act-timer-danger"
            : warning
              ? "bg-amber-500 text-white"
              : "bg-slate-100 text-slate-700"
        }`}
        aria-live="off"
      >
        ⏱ {hidden ? th.runner.hiddenTimer : format(remaining)}
      </span>
      <button
        type="button"
        onClick={() => setHidden((v) => !v)}
        className="text-slate-400 hover:text-slate-600 text-sm px-1 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        aria-label={hidden ? "แสดงเวลา" : "ซ่อนเวลา"}
        title={hidden ? "แสดงเวลา" : "ซ่อนเวลา"}
      >
        {hidden ? "👁" : "🙈"}
      </button>
    </div>
  );
}
