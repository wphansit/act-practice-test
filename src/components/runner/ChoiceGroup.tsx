"use client";

import { choiceLetter } from "@/lib/exam/definition";
import { renderMdInline } from "@/lib/md";

/**
 * Accessible radio group with authentic ACT letters (odd: A–D/E, even:
 * F–J/K). Clicking the selected choice again deselects it (practice tool).
 */
export function ChoiceGroup({
  choices,
  selectedIndex,
  questionPosition,
  onSelect,
  disabled = false,
}: {
  choices: string[];
  selectedIndex: number | null;
  questionPosition: number;
  onSelect: (index: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={`ตัวเลือกข้อ ${questionPosition}`} className="space-y-2">
      {choices.map((choice, i) => {
        const selected = selectedIndex === i;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onSelect(selected ? null : i)}
            className={`w-full min-h-11 flex items-start gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 ${
              selected
                ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span
              className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {choiceLetter(questionPosition, i)}
            </span>
            <span
              className="act-serif text-[16px] text-slate-800 pt-0.5"
              dangerouslySetInnerHTML={{ __html: renderMdInline(choice) }}
            />
          </button>
        );
      })}
    </div>
  );
}
