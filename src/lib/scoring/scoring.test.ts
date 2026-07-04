import { describe, expect, it } from "vitest";
import { SECTIONS, SECTION_CODES } from "../exam/definition";
import { RAW_TO_SCALE } from "./conversion-tables";
import { compositeOf, gradeSection, rawToScale } from "./index";

describe("conversion tables", () => {
  it.each(SECTION_CODES)("%s table covers raw 0..N, monotonic, 1..36", (code) => {
    const table = RAW_TO_SCALE[code];
    expect(table.length).toBe(SECTIONS[code].questionCount + 1);
    expect(table[0]).toBe(1);
    expect(table[table.length - 1]).toBe(36);
    for (let i = 1; i < table.length; i++) {
      expect(table[i]).toBeGreaterThanOrEqual(table[i - 1]);
      expect(table[i]).toBeGreaterThanOrEqual(1);
      expect(table[i]).toBeLessThanOrEqual(36);
    }
  });
});

describe("gradeSection", () => {
  const correct = new Map([
    [101, 0],
    [102, 2],
    [103, 1],
    [104, 3],
  ]);

  it("counts only exact matches", () => {
    const selected = new Map<number, number | null>([
      [101, 0], // right
      [102, 1], // wrong
      [103, 1], // right
    ]);
    expect(gradeSection(correct, selected)).toBe(2);
  });

  it("treats null and missing responses as unanswered (0, no penalty)", () => {
    const selected = new Map<number, number | null>([
      [101, null],
      [102, 2],
    ]);
    expect(gradeSection(correct, selected)).toBe(1);
  });

  it("scores 0 for an empty response set", () => {
    expect(gradeSection(correct, new Map())).toBe(0);
  });
});

describe("rawToScale", () => {
  it("maps perfect and zero raw scores", () => {
    expect(rawToScale("english", 75)).toBe(36);
    expect(rawToScale("math", 60)).toBe(36);
    expect(rawToScale("reading", 40)).toBe(36);
    expect(rawToScale("science", 40)).toBe(36);
    expect(rawToScale("english", 0)).toBe(1);
  });

  it("clamps out-of-range raw scores", () => {
    expect(rawToScale("reading", 99)).toBe(36);
    expect(rawToScale("reading", -5)).toBe(1);
  });
});

describe("compositeOf", () => {
  it("rounds half up like the real ACT", () => {
    expect(compositeOf([23, 23, 24, 24])).toBe(24); // 23.5 → 24
    expect(compositeOf([23, 23, 23, 24])).toBe(23); // 23.25 → 23
    expect(compositeOf([24, 24, 24, 23])).toBe(24); // 23.75 → 24
    expect(compositeOf([36, 36, 36, 36])).toBe(36);
    expect(compositeOf([1, 1, 1, 1])).toBe(1);
  });

  it("rejects wrong arity", () => {
    expect(() => compositeOf([30, 30, 30])).toThrow();
  });
});
