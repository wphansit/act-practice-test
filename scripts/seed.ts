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
import fs from "node:fs";
import path from "node:path";
import { getDb, nowIso } from "../src/lib/db";
import { SECTIONS, SECTION_CODES, type SectionCode } from "../src/lib/exam/definition";
import { seedFileSchema, type SeedFile } from "../src/lib/seed-schema";

const args = new Set(process.argv.slice(2));
const partial = args.has("--partial");
const force = args.has("--force");

const seedRoot = path.join(process.cwd(), "db", "seed");

interface LoadedFile {
  relPath: string;
  data: SeedFile;
}

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

// ---------- 1. Read + validate every file ----------
const loaded: LoadedFile[] = [];
for (const section of SECTION_CODES) {
  const dir = path.join(seedRoot, section);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const relPath = `${section}/${file}`;
    let json: unknown;
    try {
      json = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    } catch (e) {
      fail(`${relPath}: invalid JSON — ${(e as Error).message}`);
    }
    const parsed = seedFileSchema.safeParse(json);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      fail(`${relPath}: schema validation failed\n${issues}`);
    }
    if (parsed.data.section !== section) {
      fail(`${relPath}: section "${parsed.data.section}" does not match directory "${section}"`);
    }
    loaded.push({ relPath, data: parsed.data });
  }
}

if (loaded.length === 0) fail(`no seed files found under ${seedRoot}`);

// ---------- 2. Cross-file checks ----------
for (const section of SECTION_CODES) {
  const files = loaded.filter((f) => f.data.section === section);
  if (files.length === 0) {
    if (!partial) fail(`section "${section}" has no seed files (use --partial to allow)`);
    continue;
  }
  const positions = files.flatMap((f) => f.data.questions.map((q) => q.position));
  const seen = new Set<number>();
  for (const p of positions) {
    if (seen.has(p)) fail(`section "${section}": duplicate question position ${p} across files`);
    seen.add(p);
  }
  const passagePositions = files
    .map((f) => f.data.passage?.position)
    .filter((p): p is number => p !== undefined && p !== null);
  if (new Set(passagePositions).size !== passagePositions.length) {
    fail(`section "${section}": duplicate passage positions across files`);
  }
  if (!partial) {
    const expected = SECTIONS[section].questionCount;
    if (positions.length !== expected) {
      fail(`section "${section}": expected ${expected} questions total, got ${positions.length}`);
    }
    for (let p = 1; p <= expected; p++) {
      if (!seen.has(p)) fail(`section "${section}": missing question position ${p}`);
    }
  }
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
