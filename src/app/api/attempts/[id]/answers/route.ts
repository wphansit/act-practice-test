import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAttemptSection } from "@/lib/dal/attempts";
import { getQuestion } from "@/lib/dal/questions";
import { upsertResponse } from "@/lib/dal/responses";
import { DEADLINE_GRACE_MS } from "@/lib/exam/definition";
import { requireAttempt } from "@/lib/exam/guard";

const bodySchema = z.object({
  questionId: z.number().int().positive(),
  selectedIndex: z.number().int().min(0).nullable(),
  isFlagged: z.boolean(),
});

/** Autosave one answer/flag. Rejected once the owning section is closed. */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireAttempt(req, id);
  if ("error" in guard) return guard.error;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }
  const { questionId, selectedIndex, isFlagged } = parsed.data;

  const question = getQuestion(questionId);
  if (!question || question.is_active !== 1) {
    return NextResponse.json({ error: "UNKNOWN_QUESTION" }, { status: 404 });
  }
  const choices = JSON.parse(question.choices_json) as string[];
  if (selectedIndex !== null && selectedIndex >= choices.length) {
    return NextResponse.json({ error: "INVALID_CHOICE" }, { status: 400 });
  }

  const sectionRow = getAttemptSection(id, question.section_code);
  const withinDeadline =
    sectionRow?.status === "in_progress" &&
    sectionRow.deadline_at !== null &&
    Date.now() <= Date.parse(sectionRow.deadline_at) + DEADLINE_GRACE_MS;
  if (!withinDeadline) {
    return NextResponse.json({ error: "SECTION_CLOSED" }, { status: 409 });
  }

  upsertResponse(id, questionId, selectedIndex, isFlagged);
  return NextResponse.json({ ok: true });
}
