import type { SectionCode } from "../exam/definition";
import { RAW_TO_SCALE } from "./conversion-tables";

/**
 * Count correct answers. Unanswered questions (missing from `selected`, or
 * null) score 0 — the ACT has no penalty for wrong or blank answers.
 */
export function gradeSection(
  correct: Map<number, number>,
  selected: Map<number, number | null>,
): number {
  let raw = 0;
  for (const [questionId, correctIndex] of correct) {
    if (selected.get(questionId) === correctIndex) raw++;
  }
  return raw;
}

export function rawToScale(section: SectionCode, raw: number): number {
  const table = RAW_TO_SCALE[section];
  const clamped = Math.max(0, Math.min(table.length - 1, Math.round(raw)));
  return table[clamped];
}

/**
 * Composite = mean of the four section scale scores, rounded half-up —
 * Math.round rounds .5 up for positive numbers, matching the ACT rule
 * (e.g. 23.5 → 24, 23.25 → 23).
 */
export function compositeOf(scales: readonly number[]): number {
  if (scales.length !== 4) {
    throw new Error(`compositeOf expects 4 scale scores, got ${scales.length}`);
  }
  return Math.round(scales.reduce((a, b) => a + b, 0) / 4);
}
