"use client";

import { th } from "@/lib/i18n/th";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
    >
      🖨 {th.results.print}
    </button>
  );
}
