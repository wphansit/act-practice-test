import fs from "node:fs";
import path from "node:path";
import { SECTIONS, SECTION_CODES } from "./exam/definition";
import { seedFileSchema, type SeedFile } from "./seed-schema";

export interface LoadedSeedFile {
  relPath: string;
  data: SeedFile;
}

/**
 * Read, schema-validate, and cross-check every seed file under `seedRoot`.
 * Pure (fs + zod only, no database) so it can back both the seed loader and a
 * standalone `npm run validate` that contributors run before opening a PR.
 * Throws with a human-readable message on the first problem.
 */
export function loadAndValidateSeedFiles(
  seedRoot: string,
  opts: { partial?: boolean } = {},
): LoadedSeedFile[] {
  const partial = opts.partial ?? false;
  const loaded: LoadedSeedFile[] = [];

  for (const section of SECTION_CODES) {
    const dir = path.join(seedRoot, section);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
      const relPath = `${section}/${file}`;
      let json: unknown;
      try {
        json = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
      } catch (e) {
        throw new Error(`${relPath}: invalid JSON — ${(e as Error).message}`);
      }
      const parsed = seedFileSchema.safeParse(json);
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
          .join("\n");
        throw new Error(`${relPath}: schema validation failed\n${issues}`);
      }
      if (parsed.data.section !== section) {
        throw new Error(
          `${relPath}: section "${parsed.data.section}" does not match directory "${section}"`,
        );
      }
      loaded.push({ relPath, data: parsed.data });
    }
  }

  if (loaded.length === 0) throw new Error(`no seed files found under ${seedRoot}`);

  for (const section of SECTION_CODES) {
    const files = loaded.filter((f) => f.data.section === section);
    if (files.length === 0) {
      if (!partial) throw new Error(`section "${section}" has no seed files (use --partial to allow)`);
      continue;
    }
    const positions = files.flatMap((f) => f.data.questions.map((q) => q.position));
    const seen = new Set<number>();
    for (const p of positions) {
      if (seen.has(p)) throw new Error(`section "${section}": duplicate question position ${p} across files`);
      seen.add(p);
    }
    const passagePositions = files
      .map((f) => f.data.passage?.position)
      .filter((p): p is number => p !== undefined && p !== null);
    if (new Set(passagePositions).size !== passagePositions.length) {
      throw new Error(`section "${section}": duplicate passage positions across files`);
    }
    if (!partial) {
      const expected = SECTIONS[section].questionCount;
      if (positions.length !== expected) {
        throw new Error(`section "${section}": expected ${expected} questions total, got ${positions.length}`);
      }
      for (let p = 1; p <= expected; p++) {
        if (!seen.has(p)) throw new Error(`section "${section}": missing question position ${p}`);
      }
    }
  }

  return loaded;
}
