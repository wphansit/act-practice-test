import {
  completeAttempt,
  getAttempt,
  getAttemptSection,
  getAttemptSections,
  markSectionSubmitted,
} from "../dal/attempts";
import { getCorrectMap } from "../dal/questions";
import { getSelectedMap } from "../dal/responses";
import { compositeOf, gradeSection, rawToScale } from "../scoring";
import { DEADLINE_GRACE_MS, type SectionCode } from "./definition";

/**
 * Grade a section from saved responses and freeze its scores. Idempotent —
 * an already-submitted section returns its frozen scores untouched.
 */
export function gradeAndSubmitSection(
  attemptId: string,
  section: SectionCode,
): { raw: number; scale: number } {
  const row = getAttemptSection(attemptId, section);
  if (!row) throw new Error("SECTION_NOT_FOUND");
  if (row.status === "submitted") {
    return { raw: row.raw_score ?? 0, scale: row.scale_score ?? 1 };
  }
  const raw = gradeSection(getCorrectMap(section), getSelectedMap(attemptId, section));
  const scale = rawToScale(section, raw);
  markSectionSubmitted(attemptId, section, raw, scale);
  maybeFinalizeAttempt(attemptId);
  return { raw, scale };
}

/** When all four sections are frozen, compute the composite and close out. */
export function maybeFinalizeAttempt(attemptId: string): void {
  const sections = getAttemptSections(attemptId);
  if (sections.length === 0 || !sections.every((s) => s.status === "submitted")) return;
  const attempt = getAttempt(attemptId);
  if (!attempt || attempt.status !== "in_progress") return;
  const composite = compositeOf(sections.map((s) => s.scale_score ?? 1));
  completeAttempt(attemptId, composite);
}

/**
 * Server-side timer backstop, called at the top of every attempt-scoped
 * request: any in-progress section past its deadline (+grace) is auto-
 * submitted with whatever answers were saved. No cron needed — attempt state
 * repairs itself the next time anything touches it.
 */
export function enforceDeadlines(attemptId: string): void {
  const now = Date.now();
  for (const s of getAttemptSections(attemptId)) {
    if (
      s.status === "in_progress" &&
      s.deadline_at &&
      Date.parse(s.deadline_at) + DEADLINE_GRACE_MS < now
    ) {
      gradeAndSubmitSection(attemptId, s.section_code);
    }
  }
}
