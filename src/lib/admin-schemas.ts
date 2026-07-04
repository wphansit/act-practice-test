import { z } from "zod";
import { SECTIONS, SECTION_CODES } from "./exam/definition";

export const questionInputSchema = z
  .object({
    section_code: z.enum(SECTION_CODES),
    passage_id: z.number().int().positive().nullable(),
    position: z.number().int().positive(),
    stem_md: z.string().min(1),
    choices: z.array(z.string().min(1)).min(4).max(5),
    correct_index: z.number().int().min(0),
    explanation_md: z.string().min(1),
    difficulty: z.enum(["easy", "medium", "hard"]),
    topic: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    const def = SECTIONS[data.section_code];
    if (data.choices.length !== def.choiceCount) {
      ctx.addIssue({
        code: "custom",
        message: `พาร์ท ${def.nameEn} ต้องมี ${def.choiceCount} ตัวเลือก`,
        path: ["choices"],
      });
    }
    if (data.correct_index >= data.choices.length) {
      ctx.addIssue({ code: "custom", message: "เฉลยไม่อยู่ในช่วงตัวเลือก", path: ["correct_index"] });
    }
    if (data.section_code === "math" && data.passage_id !== null) {
      ctx.addIssue({ code: "custom", message: "พาร์ท Math ไม่มี passage", path: ["passage_id"] });
    }
    if (data.section_code !== "math" && data.passage_id === null) {
      ctx.addIssue({ code: "custom", message: "ต้องเลือก passage", path: ["passage_id"] });
    }
    if (data.position > def.questionCount) {
      ctx.addIssue({
        code: "custom",
        message: `ลำดับข้อต้องไม่เกิน ${def.questionCount}`,
        path: ["position"],
      });
    }
  });

export type QuestionInputData = z.infer<typeof questionInputSchema>;

export const passageInputSchema = z.object({
  section_code: z.enum(SECTION_CODES).refine((s) => s !== "math", "พาร์ท Math ไม่มี passage"),
  position: z.number().int().positive(),
  title: z.string().min(1),
  body_md: z.string().min(1),
  kind: z.string().nullable(),
});

export type PassageInputData = z.infer<typeof passageInputSchema>;
