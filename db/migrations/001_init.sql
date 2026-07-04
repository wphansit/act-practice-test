-- ACT practice test — initial schema.
-- Timestamps are ISO-8601 UTC strings written by application code.

CREATE TABLE sections (
  code TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_th TEXT NOT NULL,
  position INTEGER NOT NULL UNIQUE,
  duration_seconds INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  choice_count INTEGER NOT NULL
);

INSERT INTO sections (code, name_en, name_th, position, duration_seconds, question_count, choice_count) VALUES
  ('english', 'English',     'ภาษาอังกฤษ',  1, 2700, 75, 4),
  ('math',    'Mathematics', 'คณิตศาสตร์',   2, 3600, 60, 5),
  ('reading', 'Reading',     'การอ่าน',      3, 2100, 40, 4),
  ('science', 'Science',     'วิทยาศาสตร์',  4, 2100, 40, 4);

CREATE TABLE passages (
  id INTEGER PRIMARY KEY,
  section_code TEXT NOT NULL REFERENCES sections(code),
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL,
  kind TEXT,
  UNIQUE(section_code, position)
);

CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  section_code TEXT NOT NULL REFERENCES sections(code),
  passage_id INTEGER REFERENCES passages(id),
  position INTEGER NOT NULL,
  stem_md TEXT NOT NULL,
  choices_json TEXT NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation_md TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Active questions must not collide on (section, position); inactive ones may
-- keep their old position so a replacement can be created at the same slot.
CREATE UNIQUE INDEX idx_questions_active_position
  ON questions(section_code, position) WHERE is_active = 1;
CREATE INDEX idx_questions_passage ON questions(passage_id);

CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  student_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  composite_score INTEGER
);

CREATE TABLE attempt_sections (
  id INTEGER PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  section_code TEXT NOT NULL REFERENCES sections(code),
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'submitted')),
  started_at TEXT,
  deadline_at TEXT,
  submitted_at TEXT,
  raw_score INTEGER,
  scale_score INTEGER,
  UNIQUE(attempt_id, section_code)
);

CREATE INDEX idx_attempt_sections_attempt ON attempt_sections(attempt_id);

CREATE TABLE responses (
  id INTEGER PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  selected_index INTEGER,
  is_flagged INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  UNIQUE(attempt_id, question_id)
);

CREATE INDEX idx_responses_attempt ON responses(attempt_id);
CREATE INDEX idx_responses_question ON responses(question_id);
