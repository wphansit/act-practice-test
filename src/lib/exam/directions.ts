import type { SectionCode } from "./definition";

// Authentic ACT-style directions (original wording, adapted for the digital
// one-question-at-a-time format). Shown in English on each section's
// instructions page, like the real exam.
export const DIRECTIONS: Record<SectionCode, string> = {
  english: `In the passages that follow, certain words and phrases are underlined. On each screen you will see one question about an underlined portion (or about the passage as a whole). Choose the alternative that best expresses the idea, makes the statement appropriate for standard written English, or is worded most consistently with the style and tone of the passage. If you think the original version is best, choose "NO CHANGE." For questions about the passage as a whole, choose the best answer to the question. You cannot return to this part of the test after time expires.`,
  math: `Solve each problem, then choose the correct answer. Do not linger over problems that take too much time — solve as many as you can, then return to the others in the time you have left. You are permitted to use an approved calculator. Unless otherwise stated: illustrative figures are NOT necessarily drawn to scale; geometric figures lie in a plane; the word "line" indicates a straight line; and the word "average" indicates arithmetic mean.`,
  reading: `There are several passages in this part. Each passage is accompanied by a number of questions. After reading a passage, choose the best answer to each question. You may refer to the passage (shown beside each question) as often as necessary.`,
  science: `There are several passages in this part. Each passage is followed by several questions. After reading a passage, choose the best answer to each question. You may refer to the passage (shown beside each question) as often as necessary. You are NOT permitted to use a calculator on this part.`,
};
