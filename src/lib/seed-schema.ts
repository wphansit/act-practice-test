import { z } from "zod";
import { SECTIONS, SECTION_CODES } from "./exam/definition";

export const seedQuestionSchema = z.object({
  position: z.number().int().positive(),
  stem_md: z.string().min(1),
  choices: z.array(z.string().min(1)).min(4).max(5),
  correct_index: z.number().int().min(0),
  explanation_md: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topic: z.string().min(1),
});

export const seedFileSchema = z
  .object({
    section: z.enum(SECTION_CODES),
    passage: z
      .object({
        position: z.number().int().positive(),
        title: z.string().min(1),
        kind: z.string().nullable(),
        body_md: z.string().min(1),
      })
      .nullable(),
    questions: z.array(seedQuestionSchema).min(1),
  })
  .superRefine((data, ctx) => {
    const def = SECTIONS[data.section];
    if (data.section === "math") {
      if (data.passage !== null) {
        ctx.addIssue({
          code: "custom",
          message: "math seed files must have passage: null",
          path: ["passage"],
        });
      }
    } else if (data.passage === null) {
      ctx.addIssue({
        code: "custom",
        message: `${data.section} seed files require a passage`,
        path: ["passage"],
      });
    }
    data.questions.forEach((q, i) => {
      if (q.choices.length !== def.choiceCount) {
        ctx.addIssue({
          code: "custom",
          message: `question ${q.position}: expected ${def.choiceCount} choices for ${data.section}, got ${q.choices.length}`,
          path: ["questions", i, "choices"],
        });
      }
      if (q.correct_index >= q.choices.length) {
        ctx.addIssue({
          code: "custom",
          message: `question ${q.position}: correct_index ${q.correct_index} out of range`,
          path: ["questions", i, "correct_index"],
        });
      }
      if (q.position > def.questionCount) {
        ctx.addIssue({
          code: "custom",
          message: `question position ${q.position} exceeds ${data.section} max ${def.questionCount}`,
          path: ["questions", i, "position"],
        });
      }
    });
    for (let i = 1; i < data.questions.length; i++) {
      if (data.questions[i].position !== data.questions[i - 1].position + 1) {
        ctx.addIssue({
          code: "custom",
          message: `question positions must be contiguous ascending (${data.questions[i - 1].position} → ${data.questions[i].position})`,
          path: ["questions", i, "position"],
        });
      }
    }
  });

export type SeedFile = z.infer<typeof seedFileSchema>;
