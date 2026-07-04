// Builders for every JSON shape the exam-facing side sees. Sanitization rule:
// while an attempt is in progress, questions go through toClientQuestion()
// (no correct_index / explanation_md); answers only appear in resultPayload,
// which is gated on attempt.status === 'completed'.

import type { AttemptRow, AttemptSectionRow } from "../dal/attempts";
import { getAttemptSections } from "../dal/attempts";
import {
  getActiveSectionQuestions,
  getSectionPassages,
  toClientQuestion,
  type ClientQuestion,
} from "../dal/questions";
import { getAttemptResponses, getSelectedMap, getSectionResponses } from "../dal/responses";
import {
  SECTIONS,
  SECTION_ORDER,
  effectiveDurationSeconds,
  type SectionCode,
} from "./definition";

export interface ClientPassage {
  id: number;
  position: number;
  title: string;
  bodyMd: string;
  kind: string | null;
}

export interface SectionStatePayload {
  code: SectionCode;
  position: number;
  status: AttemptSectionRow["status"];
  startedAt: string | null;
  deadlineAt: string | null;
  submittedAt: string | null;
}

export interface AttemptStatePayload {
  attemptId: string;
  studentName: string;
  status: AttemptRow["status"];
  sections: SectionStatePayload[];
}

export function attemptStatePayload(attempt: AttemptRow): AttemptStatePayload {
  return {
    attemptId: attempt.id,
    studentName: attempt.student_name,
    status: attempt.status,
    sections: getAttemptSections(attempt.id).map((s) => ({
      code: s.section_code,
      position: s.position,
      status: s.status,
      startedAt: s.started_at,
      deadlineAt: s.deadline_at,
      submittedAt: s.submitted_at,
    })),
  };
}

export interface ResponseState {
  questionId: number;
  selectedIndex: number | null;
  isFlagged: boolean;
}

export interface SectionRunnerPayload {
  attemptId: string;
  section: {
    code: SectionCode;
    nameEn: string;
    nameTh: string;
    position: number;
    questionCount: number;
    choiceCount: number;
    durationSeconds: number;
  };
  deadlineAt: string;
  serverNow: string;
  passages: ClientPassage[];
  questions: ClientQuestion[];
  responses: ResponseState[];
}

export function sectionRunnerPayload(
  attemptId: string,
  sectionRow: AttemptSectionRow,
): SectionRunnerPayload {
  const code = sectionRow.section_code;
  const def = SECTIONS[code];
  return {
    attemptId,
    section: {
      code,
      nameEn: def.nameEn,
      nameTh: def.nameTh,
      position: def.position,
      questionCount: def.questionCount,
      choiceCount: def.choiceCount,
      durationSeconds: effectiveDurationSeconds(code),
    },
    deadlineAt: sectionRow.deadline_at ?? "",
    serverNow: new Date().toISOString(),
    passages: getSectionPassages(code).map((p) => ({
      id: p.id,
      position: p.position,
      title: p.title,
      bodyMd: p.body_md,
      kind: p.kind,
    })),
    questions: getActiveSectionQuestions(code).map(toClientQuestion),
    responses: getSectionResponses(attemptId, code).map((r) => ({
      questionId: r.question_id,
      selectedIndex: r.selected_index,
      isFlagged: r.is_flagged === 1,
    })),
  };
}

export interface ReviewQuestion {
  id: number;
  position: number;
  stemMd: string;
  choices: string[];
  passageId: number | null;
  selectedIndex: number | null;
  correctIndex: number;
  explanationMd: string;
}

export interface ResultSectionPayload {
  code: SectionCode;
  nameEn: string;
  nameTh: string;
  questionCount: number;
  rawScore: number;
  scaleScore: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  startedAt: string | null;
  submittedAt: string | null;
  review: ReviewQuestion[];
  passages: ClientPassage[];
}

export interface ResultPayload {
  attemptId: string;
  studentName: string;
  startedAt: string;
  completedAt: string | null;
  composite: number;
  sections: ResultSectionPayload[];
}

/** Full score report + answer key. Caller MUST verify attempt is completed. */
export function resultPayload(attempt: AttemptRow): ResultPayload {
  const sectionRows = getAttemptSections(attempt.id);
  return {
    attemptId: attempt.id,
    studentName: attempt.student_name,
    startedAt: attempt.started_at,
    completedAt: attempt.completed_at,
    composite: attempt.composite_score ?? 0,
    sections: SECTION_ORDER.map((code) => {
      const def = SECTIONS[code];
      const row = sectionRows.find((s) => s.section_code === code);
      const questions = getActiveSectionQuestions(code);
      const selected = getSelectedMap(attempt.id, code);
      let correct = 0;
      let answered = 0;
      const review: ReviewQuestion[] = questions.map((q) => {
        const sel = selected.get(q.id) ?? null;
        if (sel !== null) answered++;
        if (sel === q.correct_index) correct++;
        return {
          id: q.id,
          position: q.position,
          stemMd: q.stem_md,
          choices: JSON.parse(q.choices_json) as string[],
          passageId: q.passage_id,
          selectedIndex: sel,
          correctIndex: q.correct_index,
          explanationMd: q.explanation_md,
        };
      });
      return {
        code,
        nameEn: def.nameEn,
        nameTh: def.nameTh,
        questionCount: def.questionCount,
        rawScore: row?.raw_score ?? correct,
        scaleScore: row?.scale_score ?? 1,
        correct,
        incorrect: answered - correct,
        unanswered: questions.length - answered,
        startedAt: row?.started_at ?? null,
        submittedAt: row?.submitted_at ?? null,
        review,
        passages: getSectionPassages(code).map((p) => ({
          id: p.id,
          position: p.position,
          title: p.title,
          bodyMd: p.body_md,
          kind: p.kind,
        })),
      };
    }),
  };
}

// Re-export so UI code can import everything exam-shaped from one place.
export type { ClientQuestion };
export { getAttemptResponses };
