import { getDb, nowIso } from "../db";
import type { SectionCode } from "../exam/definition";

export interface ResponseRow {
  id: number;
  attempt_id: string;
  question_id: number;
  selected_index: number | null;
  is_flagged: number;
  updated_at: string;
}

/** Full-state upsert for one question's answer + flag. Last write wins. */
export function upsertResponse(
  attemptId: string,
  questionId: number,
  selectedIndex: number | null,
  isFlagged: boolean,
): void {
  getDb()
    .prepare(
      `INSERT INTO responses (attempt_id, question_id, selected_index, is_flagged, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(attempt_id, question_id)
       DO UPDATE SET selected_index = excluded.selected_index,
                     is_flagged = excluded.is_flagged,
                     updated_at = excluded.updated_at`,
    )
    .run(attemptId, questionId, selectedIndex, isFlagged ? 1 : 0, nowIso());
}

export function getAttemptResponses(attemptId: string): ResponseRow[] {
  return getDb()
    .prepare(`SELECT * FROM responses WHERE attempt_id = ?`)
    .all(attemptId) as ResponseRow[];
}

export function getSectionResponses(
  attemptId: string,
  section: SectionCode,
): ResponseRow[] {
  return getDb()
    .prepare(
      `SELECT r.* FROM responses r
       JOIN questions q ON q.id = r.question_id
       WHERE r.attempt_id = ? AND q.section_code = ?`,
    )
    .all(attemptId, section) as ResponseRow[];
}

/** questionId → selected index (null = flagged/seen but unanswered). */
export function getSelectedMap(
  attemptId: string,
  section: SectionCode,
): Map<number, number | null> {
  return new Map(
    getSectionResponses(attemptId, section).map((r) => [r.question_id, r.selected_index]),
  );
}
