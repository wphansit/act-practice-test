/**
 * Validate every db/seed file against the schema and cross-file rules WITHOUT
 * touching the database. Run this before opening a pull request that adds or
 * edits questions:  npm run validate  (add --partial to allow incomplete sets)
 */
import path from "node:path";
import { SECTIONS, SECTION_CODES } from "../src/lib/exam/definition";
import { loadAndValidateSeedFiles } from "../src/lib/seed-validate";

const partial = process.argv.slice(2).includes("--partial");
const seedRoot = path.join(process.cwd(), "db", "seed");

try {
  const loaded = loadAndValidateSeedFiles(seedRoot, { partial });
  console.log(`✅ ${loaded.length} seed file(s) valid`);
  for (const section of SECTION_CODES) {
    const count = loaded
      .filter((f) => f.data.section === section)
      .reduce((n, f) => n + f.data.questions.length, 0);
    console.log(`   ${section.padEnd(8)} ${String(count).padStart(3)}/${SECTIONS[section].questionCount}`);
  }
} catch (e) {
  console.error(`❌ ${(e as Error).message}`);
  process.exit(1);
}
