// Single source of truth for the classic ACT exam structure.
// The sections table in SQLite mirrors these values for FK integrity and
// admin display, but all runtime timing/count decisions read from here.

export const SECTION_CODES = ["english", "math", "reading", "science"] as const;
export type SectionCode = (typeof SECTION_CODES)[number];

export interface SectionDef {
  code: SectionCode;
  nameEn: string;
  nameTh: string;
  position: number; // 1..4, fixed ACT order
  durationSeconds: number;
  questionCount: number;
  choiceCount: number;
}

export const SECTIONS: Record<SectionCode, SectionDef> = {
  english: {
    code: "english",
    nameEn: "English",
    nameTh: "ภาษาอังกฤษ",
    position: 1,
    durationSeconds: 45 * 60,
    questionCount: 75,
    choiceCount: 4,
  },
  math: {
    code: "math",
    nameEn: "Mathematics",
    nameTh: "คณิตศาสตร์",
    position: 2,
    durationSeconds: 60 * 60,
    questionCount: 60,
    choiceCount: 5,
  },
  reading: {
    code: "reading",
    nameEn: "Reading",
    nameTh: "การอ่าน",
    position: 3,
    durationSeconds: 35 * 60,
    questionCount: 40,
    choiceCount: 4,
  },
  science: {
    code: "science",
    nameEn: "Science",
    nameTh: "วิทยาศาสตร์",
    position: 4,
    durationSeconds: 35 * 60,
    questionCount: 40,
    choiceCount: 4,
  },
};

export const SECTION_ORDER: readonly SectionCode[] = [...SECTION_CODES].sort(
  (a, b) => SECTIONS[a].position - SECTIONS[b].position,
);

export const TOTAL_QUESTIONS = SECTION_ORDER.reduce(
  (sum, code) => sum + SECTIONS[code].questionCount,
  0,
);

export function isSectionCode(value: string): value is SectionCode {
  return (SECTION_CODES as readonly string[]).includes(value);
}

export function sectionByPosition(position: number): SectionDef | null {
  return SECTION_ORDER.map((c) => SECTIONS[c]).find((s) => s.position === position) ?? null;
}

// Server-side only. ACT_DURATION_OVERRIDE (seconds) shortens every section —
// used to exercise timeout/auto-submit flows without waiting 45 minutes.
export function effectiveDurationSeconds(code: SectionCode): number {
  const override = Number(process.env.ACT_DURATION_OVERRIDE);
  if (Number.isFinite(override) && override > 0) return override;
  return SECTIONS[code].durationSeconds;
}

// Grace window (ms) past a section deadline during which in-flight answer
// saves are still accepted.
export const DEADLINE_GRACE_MS = 5_000;

// ACT answer-sheet lettering: odd questions A/B/C/D(/E), even F/G/H/J(/K).
// "I" and "O" are never used. Display-only — storage is 0-based indexes.
const ODD_LETTERS = ["A", "B", "C", "D", "E"];
const EVEN_LETTERS = ["F", "G", "H", "J", "K"];

export function choiceLetter(questionPosition: number, choiceIndex: number): string {
  const letters = questionPosition % 2 === 1 ? ODD_LETTERS : EVEN_LETTERS;
  return letters[choiceIndex] ?? "?";
}
