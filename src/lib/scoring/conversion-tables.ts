import { SECTIONS, type SectionCode } from "../exam/definition";

/**
 * Raw → scale (1–36) lookup: index = raw score, value = scale score.
 * Realistic-SHAPED practice tables (hand-authored, not official ACT tables —
 * real tables vary slightly per test form anyway).
 *
 * Lengths must be questionCount + 1 (raw 0..N): 76 / 61 / 41 / 41.
 */
export const RAW_TO_SCALE: Record<SectionCode, readonly number[]> = {
  // prettier-ignore
  english: [
     1,  1,  1,  2,  2,  3,  3,  4,  4,  5,   // raw 0–9
     5,  6,  6,  7,  7,  7,  8,  8,  8,  9,   // raw 10–19
     9, 10, 10, 10, 11, 11, 12, 12, 13, 13,   // raw 20–29
    14, 14, 14, 15, 15, 15, 16, 16, 16, 17,   // raw 30–39
    17, 18, 18, 19, 19, 19, 20, 20, 20, 21,   // raw 40–49
    21, 21, 22, 22, 23, 23, 24, 24, 25, 25,   // raw 50–59
    26, 26, 27, 27, 28, 28, 29, 30, 31, 32,   // raw 60–69
    33, 34, 34, 35, 35, 36,                    // raw 70–75
  ],
  // prettier-ignore
  math: [
     1,  1,  1,  2,  2,  3,  3,  4,  4,  5,   // raw 0–9
     5,  6,  7,  8,  9, 10, 11, 12, 13, 13,   // raw 10–19
    14, 14, 15, 15, 16, 16, 17, 17, 18, 18,   // raw 20–29
    19, 19, 20, 21, 21, 22, 22, 23, 23, 24,   // raw 30–39
    24, 25, 25, 26, 26, 27, 27, 28, 28, 29,   // raw 40–49
    30, 30, 31, 32, 33, 33, 34, 34, 35, 35,   // raw 50–59
    36,                                        // raw 60
  ],
  // prettier-ignore
  reading: [
     1,  1,  1,  2,  2,  3,  4,  4,  5,  6,   // raw 0–9
     7,  8,  9, 10, 11, 12, 13, 15, 16, 18,   // raw 10–19
    19, 20, 21, 22, 23, 24, 25, 26, 27, 28,   // raw 20–29
    29, 30, 31, 32, 33, 34, 34, 35, 35, 36,   // raw 30–39
    36,                                        // raw 40
  ],
  // prettier-ignore
  science: [
     1,  1,  1,  2,  2,  3,  3,  4,  5,  6,   // raw 0–9
     7,  7,  8,  9, 10, 11, 12, 13, 14, 15,   // raw 10–19
    16, 17, 18, 19, 20, 21, 22, 23, 24, 25,   // raw 20–29
    26, 27, 28, 29, 30, 31, 32, 33, 34, 35,   // raw 30–39
    36,                                        // raw 40
  ],
};

// Fail fast at module load if a table is malformed.
for (const [code, table] of Object.entries(RAW_TO_SCALE)) {
  const expected = SECTIONS[code as SectionCode].questionCount + 1;
  if (table.length !== expected) {
    throw new Error(
      `RAW_TO_SCALE.${code}: expected ${expected} entries (raw 0..${expected - 1}), got ${table.length}`,
    );
  }
  for (let i = 0; i < table.length; i++) {
    if (table[i] < 1 || table[i] > 36) {
      throw new Error(`RAW_TO_SCALE.${code}[${i}] = ${table[i]} out of range 1..36`);
    }
    if (i > 0 && table[i] < table[i - 1]) {
      throw new Error(`RAW_TO_SCALE.${code} not monotonic at raw ${i}`);
    }
  }
  if (table[table.length - 1] !== 36) {
    throw new Error(`RAW_TO_SCALE.${code}: perfect raw score must map to 36`);
  }
}
