import { nanoid } from "nanoid";
import { getDb, nowIso } from "../db";
import { SECTIONS, SECTION_ORDER, type SectionCode } from "../exam/definition";

export type AttemptStatus = "in_progress" | "completed" | "abandoned";
export type AttemptSectionStatus = "not_started" | "in_progress" | "submitted";

export interface AttemptRow {
  id: string;
  token: string;
  student_name: string;
  status: AttemptStatus;
  started_at: string;
  completed_at: string | null;
  composite_score: number | null;
}

export interface AttemptSectionRow {
  id: number;
  attempt_id: string;
  section_code: SectionCode;
  position: number;
  status: AttemptSectionStatus;
  started_at: string | null;
  deadline_at: string | null;
  submitted_at: string | null;
  raw_score: number | null;
  scale_score: number | null;
}

export function createAttempt(studentName: string): { id: string; token: string } {
  const db = getDb();
  const id = nanoid(12);
  const token = nanoid(32);
  db.transaction(() => {
    db.prepare(
      `INSERT INTO attempts (id, token, student_name, status, started_at)
       VALUES (?, ?, ?, 'in_progress', ?)`,
    ).run(id, token, studentName, nowIso());
    const insertSection = db.prepare(
      `INSERT INTO attempt_sections (attempt_id, section_code, position, status)
       VALUES (?, ?, ?, 'not_started')`,
    );
    for (const code of SECTION_ORDER) {
      insertSection.run(id, code, SECTIONS[code].position);
    }
  })();
  return { id, token };
}

export function getAttempt(id: string): AttemptRow | undefined {
  return getDb().prepare(`SELECT * FROM attempts WHERE id = ?`).get(id) as
    | AttemptRow
    | undefined;
}

export function getAttemptSections(attemptId: string): AttemptSectionRow[] {
  return getDb()
    .prepare(`SELECT * FROM attempt_sections WHERE attempt_id = ? ORDER BY position`)
    .all(attemptId) as AttemptSectionRow[];
}

export function getAttemptSection(
  attemptId: string,
  section: SectionCode,
): AttemptSectionRow | undefined {
  return getDb()
    .prepare(`SELECT * FROM attempt_sections WHERE attempt_id = ? AND section_code = ?`)
    .get(attemptId, section) as AttemptSectionRow | undefined;
}

/**
 * Transition not_started → in_progress with a server-anchored deadline.
 * Idempotent at the SQL level: only fires when still not_started.
 */
export function startSection(
  attemptId: string,
  section: SectionCode,
  startedAtIso: string,
  deadlineIso: string,
): void {
  getDb()
    .prepare(
      `UPDATE attempt_sections
       SET status = 'in_progress', started_at = ?, deadline_at = ?
       WHERE attempt_id = ? AND section_code = ? AND status = 'not_started'`,
    )
    .run(startedAtIso, deadlineIso, attemptId, section);
}

export function markSectionSubmitted(
  attemptId: string,
  section: SectionCode,
  rawScore: number,
  scaleScore: number,
): void {
  getDb()
    .prepare(
      `UPDATE attempt_sections
       SET status = 'submitted', submitted_at = ?, raw_score = ?, scale_score = ?
       WHERE attempt_id = ? AND section_code = ? AND status != 'submitted'`,
    )
    .run(nowIso(), rawScore, scaleScore, attemptId, section);
}

export function completeAttempt(attemptId: string, compositeScore: number): void {
  getDb()
    .prepare(
      `UPDATE attempts SET status = 'completed', completed_at = ?, composite_score = ?
       WHERE id = ? AND status = 'in_progress'`,
    )
    .run(nowIso(), compositeScore, attemptId);
}

export function markAbandoned(attemptId: string): void {
  getDb()
    .prepare(`UPDATE attempts SET status = 'abandoned' WHERE id = ? AND status = 'in_progress'`)
    .run(attemptId);
}

// ---------- Admin ----------

export interface AttemptListRow extends AttemptRow {
  sections: AttemptSectionRow[];
}

export function listAttempts(status?: AttemptStatus): AttemptListRow[] {
  const db = getDb();
  const attempts = (
    status
      ? db.prepare(`SELECT * FROM attempts WHERE status = ? ORDER BY started_at DESC`).all(status)
      : db.prepare(`SELECT * FROM attempts ORDER BY started_at DESC`).all()
  ) as AttemptRow[];
  const sectionStmt = db.prepare(
    `SELECT * FROM attempt_sections WHERE attempt_id = ? ORDER BY position`,
  );
  return attempts.map((a) => ({
    ...a,
    sections: sectionStmt.all(a.id) as AttemptSectionRow[],
  }));
}

export function deleteAttempt(attemptId: string): void {
  // responses / attempt_sections cascade via FK.
  getDb().prepare(`DELETE FROM attempts WHERE id = ?`).run(attemptId);
}
