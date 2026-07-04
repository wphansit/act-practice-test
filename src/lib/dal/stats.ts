import { getDb } from "../db";
import type { SectionCode } from "../exam/definition";

export interface DashboardStats {
  finishedCount: number;
  avgComposite: number | null;
  inProgressCount: number;
  activeQuestionCount: number;
}

export function dashboardStats(): DashboardStats {
  const db = getDb();
  const finished = db
    .prepare(`SELECT COUNT(*) AS n, AVG(composite_score) AS avg FROM attempts WHERE status = 'completed'`)
    .get() as { n: number; avg: number | null };
  const inProgress = db
    .prepare(`SELECT COUNT(*) AS n FROM attempts WHERE status = 'in_progress'`)
    .get() as { n: number };
  const questions = db
    .prepare(`SELECT COUNT(*) AS n FROM questions WHERE is_active = 1`)
    .get() as { n: number };
  return {
    finishedCount: finished.n,
    avgComposite: finished.avg === null ? null : Math.round(finished.avg * 10) / 10,
    inProgressCount: inProgress.n,
    activeQuestionCount: questions.n,
  };
}

export interface SectionAverage {
  section_code: SectionCode;
  avg_scale: number | null;
}

export function sectionAverages(): SectionAverage[] {
  const rows = getDb()
    .prepare(
      `SELECT s.section_code, AVG(s.scale_score) AS avg_scale
       FROM attempt_sections s
       JOIN attempts a ON a.id = s.attempt_id
       WHERE a.status = 'completed' AND s.scale_score IS NOT NULL
       GROUP BY s.section_code`,
    )
    .all() as Array<{ section_code: SectionCode; avg_scale: number | null }>;
  return rows.map((r) => ({
    section_code: r.section_code,
    avg_scale: r.avg_scale === null ? null : Math.round(r.avg_scale * 10) / 10,
  }));
}

export interface HardQuestion {
  question_id: number;
  section_code: SectionCode;
  position: number;
  stem_md: string;
  answered: number;
  correct: number;
  correct_rate: number;
}

/** Questions with the lowest correct-rate among answered responses. */
export function hardestQuestions(limit: number): HardQuestion[] {
  return getDb()
    .prepare(
      `SELECT q.id AS question_id, q.section_code, q.position, q.stem_md,
              COUNT(r.id) AS answered,
              SUM(CASE WHEN r.selected_index = q.correct_index THEN 1 ELSE 0 END) AS correct,
              CAST(SUM(CASE WHEN r.selected_index = q.correct_index THEN 1 ELSE 0 END) AS REAL)
                / COUNT(r.id) AS correct_rate
       FROM responses r
       JOIN questions q ON q.id = r.question_id
       WHERE r.selected_index IS NOT NULL
       GROUP BY q.id
       HAVING answered >= 1
       ORDER BY correct_rate ASC, answered DESC
       LIMIT ?`,
    )
    .all(limit) as HardQuestion[];
}
