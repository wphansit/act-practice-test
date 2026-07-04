"use client";

import { useEffect, useMemo, useRef } from "react";
import { activateUnderline, renderMd } from "@/lib/md";
import type { ClientPassage } from "@/lib/exam/payload";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function romanNumeral(n: number): string {
  return ROMAN[n] ?? String(n);
}

/**
 * Scrollable passage pane. When navigation crosses a passage boundary the
 * pane swaps content and scrolls back to the top; the current English
 * question's underlined portion is highlighted.
 */
export function PassagePane({
  passage,
  activePosition,
}: {
  passage: ClientPassage;
  activePosition: number | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const html = useMemo(
    () => activateUnderline(renderMd(passage.bodyMd), activePosition),
    [passage.bodyMd, activePosition],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [passage.id]);

  // Keep the active underline visible as the student moves between questions.
  useEffect(() => {
    scrollRef.current
      ?.querySelector("u.act-active")
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [html]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-white px-6 py-5">
      <p className="text-xs font-bold tracking-widest text-slate-400 mb-1">
        PASSAGE {romanNumeral(passage.position)}
      </p>
      <h2 className="act-serif text-lg font-bold text-slate-900 mb-3">{passage.title}</h2>
      <div
        className="act-serif act-content act-passage text-slate-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
