/**
 * Load seed JSON files from db/seed/<section>/*.json into SQLite.
 *
 * Usage:  npx tsx scripts/seed.ts [--partial] [--force]
 *   --partial  skip the "totals must be exactly 75/60/40/40" check
 *   --force    wipe existing attempts/responses before reseeding
 *
 * Refuses to run when attempts exist (reseeding replaces all questions and
 * would orphan them) unless --force is given.
 */
import path from "node:path";
import { getDb, nowIso } from "../src/lib/db";
import { SECTIONS, SECTION_CODES, type SectionCode } from "../src/lib/exam/definition";
import { loadAndValidateSeedFiles } from "../src/lib/seed-validate";

const args = new Set(process.argv.slice(2));
const partial = args.has("--partial");
const force = args.has("--force");

const seedRoot = path.join(process.cwd(), "db", "seed");

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

// ---------- 1+2. Read, schema-validate, and cross-check every file ----------
let loaded;
try {
  loaded = loadAndValidateSeedFiles(seedRoot, { partial });
} catch (e) {
  fail((e as Error).message);
}

// ---------- 3. Attempts guard ----------
const db = getDb();
const attemptCount = (db.prepare(`SELECT COUNT(*) AS n FROM attempts`).get() as { n: number }).n;
if (attemptCount > 0) {
  if (!force) {
    fail(
      `${attemptCount} attempt(s) exist — reseeding would orphan them. ` +
        `Re-run with --force to wipe attempts and reseed.`,
    );
  }
  console.log(`⚠️  --force: deleting ${attemptCount} attempt(s) and their responses`);
}

// ---------- 4. Insert everything in one transaction ----------
const insertPassage = db.prepare(
  `INSERT INTO passages (section_code, position, title, body_md, kind) VALUES (?, ?, ?, ?, ?)`,
);
const insertQuestion = db.prepare(
  `INSERT INTO questions
     (section_code, passage_id, position, stem_md, choices_json, correct_index,
      explanation_md, difficulty, topic, is_active, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
);

db.transaction(() => {
  if (attemptCount > 0) db.prepare(`DELETE FROM attempts`).run(); // cascades
  db.prepare(`DELETE FROM questions`).run();
  db.prepare(`DELETE FROM passages`).run();
  const now = nowIso();
  for (const { data } of loaded) {
    let passageId: number | null = null;
    if (data.passage) {
      const result = insertPassage.run(
        data.section,
        data.passage.position,
        data.passage.title,
        data.passage.body_md,
        data.passage.kind,
      );
      passageId = Number(result.lastInsertRowid);
    }
    for (const q of data.questions) {
      insertQuestion.run(
        data.section,
        passageId,
        q.position,
        q.stem_md,
        JSON.stringify(q.choices),
        q.correct_index,
        q.explanation_md,
        q.difficulty,
        q.topic,
        now,
        now,
      );
    }
  }
})();

// ---------- 5. Report ----------
console.log(`✅ Seeded from ${loaded.length} file(s):`);
for (const section of SECTION_CODES) {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS q,
              (SELECT COUNT(*) FROM passages WHERE section_code = ?) AS p
       FROM questions WHERE section_code = ? AND is_active = 1`,
    )
    .get(section, section) as { q: number; p: number };
  const expected = SECTIONS[section as SectionCode].questionCount;
  console.log(`   ${section.padEnd(8)} ${String(row.q).padStart(3)}/${expected} questions, ${row.p} passages`);
}
