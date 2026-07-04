import { getDb, nowIso } from "../db";
import type { SectionCode } from "../exam/definition";

export interface QuestionRow {
  id: number;
  section_code: SectionCode;
  passage_id: number | null;
  position: number;
  stem_md: string;
  choices_json: string;
  correct_index: number;
  explanation_md: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface PassageRow {
  id: number;
  section_code: SectionCode;
  position: number;
  title: string;
  body_md: string;
  kind: string | null;
}

// The ONLY question shape exam-facing routes may return. Deliberately has no
// correct_index / explanation_md so answers can never leak to the client.
export interface ClientQuestion {
  id: number;
  position: number;
  stemMd: string;
  choices: string[];
  passageId: number | null;
}

export function toClientQuestion(row: QuestionRow): ClientQuestion {
  return {
    id: row.id,
    position: row.position,
    stemMd: row.stem_md,
    choices: JSON.parse(row.choices_json) as string[],
    passageId: row.passage_id,
  };
}

export function getActiveSectionQuestions(section: SectionCode): QuestionRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM questions WHERE section_code = ? AND is_active = 1 ORDER BY position`,
    )
    .all(section) as QuestionRow[];
}

export function getSectionPassages(section: SectionCode): PassageRow[] {
  return getDb()
    .prepare(`SELECT * FROM passages WHERE section_code = ? ORDER BY position`)
    .all(section) as PassageRow[];
}

/** questionId → correct choice index, for server-side grading only. */
export function getCorrectMap(section: SectionCode): Map<number, number> {
  const rows = getDb()
    .prepare(
      `SELECT id, correct_index FROM questions WHERE section_code = ? AND is_active = 1`,
    )
    .all(section) as Array<{ id: number; correct_index: number }>;
  return new Map(rows.map((r) => [r.id, r.correct_index]));
}

export function getQuestion(id: number): QuestionRow | undefined {
  return getDb().prepare(`SELECT * FROM questions WHERE id = ?`).get(id) as
    | QuestionRow
    | undefined;
}

// ---------- Admin: question CRUD ----------

export interface QuestionFilters {
  section?: SectionCode;
  passageId?: number;
  topic?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface QuestionListRow extends QuestionRow {
  passage_title: string | null;
}

export function listQuestions(filters: QuestionFilters): {
  rows: QuestionListRow[];
  total: number;
} {
  const where: string[] = ["q.is_active = 1"];
  const params: unknown[] = [];
  if (filters.section) {
    where.push("q.section_code = ?");
    params.push(filters.section);
  }
  if (filters.passageId) {
    where.push("q.passage_id = ?");
    params.push(filters.passageId);
  }
  if (filters.topic) {
    where.push("q.topic = ?");
    params.push(filters.topic);
  }
  if (filters.search) {
    where.push("q.stem_md LIKE ?");
    params.push(`%${filters.search}%`);
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const db = getDb();
  const total = (
    db.prepare(`SELECT COUNT(*) AS n FROM questions q ${whereSql}`).get(...params) as {
      n: number;
    }
  ).n;
  const pageSize = filters.pageSize ?? 25;
  const offset = ((filters.page ?? 1) - 1) * pageSize;
  const rows = db
    .prepare(
      `SELECT q.*, p.title AS passage_title
       FROM questions q LEFT JOIN passages p ON p.id = q.passage_id
       ${whereSql}
       ORDER BY q.section_code, q.position
       LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset) as QuestionListRow[];
  return { rows, total };
}

export function listTopics(section?: SectionCode): string[] {
  const db = getDb();
  const rows = section
    ? db
        .prepare(
          `SELECT DISTINCT topic FROM questions WHERE section_code = ? AND is_active = 1 ORDER BY topic`,
        )
        .all(section)
    : db.prepare(`SELECT DISTINCT topic FROM questions WHERE is_active = 1 ORDER BY topic`).all();
  return (rows as Array<{ topic: string }>).map((r) => r.topic);
}

export interface QuestionInput {
  section_code: SectionCode;
  passage_id: number | null;
  position: number;
  stem_md: string;
  choices: string[];
  correct_index: number;
  explanation_md: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

export function createQuestion(input: QuestionInput): number {
  const now = nowIso();
  const result = getDb()
    .prepare(
      `INSERT INTO questions
         (section_code, passage_id, position, stem_md, choices_json, correct_index,
          explanation_md, difficulty, topic, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    )
    .run(
      input.section_code,
      input.passage_id,
      input.position,
      input.stem_md,
      JSON.stringify(input.choices),
      input.correct_index,
      input.explanation_md,
      input.difficulty,
      input.topic,
      now,
      now,
    );
  return Number(result.lastInsertRowid);
}

export function updateQuestion(id: number, input: Omit<QuestionInput, "section_code">): void {
  getDb()
    .prepare(
      `UPDATE questions SET passage_id = ?, position = ?, stem_md = ?, choices_json = ?,
         correct_index = ?, explanation_md = ?, difficulty = ?, topic = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      input.passage_id,
      input.position,
      input.stem_md,
      JSON.stringify(input.choices),
      input.correct_index,
      input.explanation_md,
      input.difficulty,
      input.topic,
      nowIso(),
      id,
    );
}

/**
 * Soft-delete when any response references the question (keeps historical
 * review pages intact); hard delete otherwise.
 */
export function deleteQuestion(id: number): "deleted" | "deactivated" {
  const db = getDb();
  const referenced = db
    .prepare(`SELECT 1 FROM responses WHERE question_id = ? LIMIT 1`)
    .get(id);
  if (referenced) {
    db.prepare(`UPDATE questions SET is_active = 0, updated_at = ? WHERE id = ?`).run(
      nowIso(),
      id,
    );
    return "deactivated";
  }
  db.prepare(`DELETE FROM questions WHERE id = ?`).run(id);
  return "deleted";
}

// ---------- Admin: passage CRUD ----------

export interface PassageListRow extends PassageRow {
  question_count: number;
}

export function listPassages(section?: SectionCode): PassageListRow[] {
  const db = getDb();
  const sql = `SELECT p.*,
      (SELECT COUNT(*) FROM questions q WHERE q.passage_id = p.id AND q.is_active = 1) AS question_count
    FROM passages p ${section ? "WHERE p.section_code = ?" : ""}
    ORDER BY p.section_code, p.position`;
  return (section ? db.prepare(sql).all(section) : db.prepare(sql).all()) as PassageListRow[];
}

export function getPassage(id: number): PassageRow | undefined {
  return getDb().prepare(`SELECT * FROM passages WHERE id = ?`).get(id) as
    | PassageRow
    | undefined;
}

export function getPassageQuestions(passageId: number): QuestionRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM questions WHERE passage_id = ? AND is_active = 1 ORDER BY position`,
    )
    .all(passageId) as QuestionRow[];
}

export interface PassageInput {
  section_code: SectionCode;
  position: number;
  title: string;
  body_md: string;
  kind: string | null;
}

export function createPassage(input: PassageInput): number {
  const result = getDb()
    .prepare(
      `INSERT INTO passages (section_code, position, title, body_md, kind)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(input.section_code, input.position, input.title, input.body_md, input.kind);
  return Number(result.lastInsertRowid);
}

export function updatePassage(id: number, input: Omit<PassageInput, "section_code">): void {
  getDb()
    .prepare(`UPDATE passages SET position = ?, title = ?, body_md = ?, kind = ? WHERE id = ?`)
    .run(input.position, input.title, input.body_md, input.kind, id);
}

/** Throws if active questions still link to the passage. */
export function deletePassage(id: number): void {
  const db = getDb();
  const linked = db
    .prepare(`SELECT COUNT(*) AS n FROM questions WHERE passage_id = ? AND is_active = 1`)
    .get(id) as { n: number };
  if (linked.n > 0) {
    throw new Error("PASSAGE_HAS_QUESTIONS");
  }
  db.prepare(`UPDATE questions SET passage_id = NULL WHERE passage_id = ?`).run(id);
  db.prepare(`DELETE FROM passages WHERE id = ?`).run(id);
}
