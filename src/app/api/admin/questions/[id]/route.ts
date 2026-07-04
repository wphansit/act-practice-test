import { NextResponse, type NextRequest } from "next/server";
import { questionInputSchema } from "@/lib/admin-schemas";
import { deleteQuestion, getQuestion, updateQuestion } from "@/lib/dal/questions";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const question = getQuestion(Number(id));
  if (!question) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(question);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const existing = getQuestion(Number(id));
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const parsed = questionInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (parsed.data.section_code !== existing.section_code) {
    return NextResponse.json({ error: "SECTION_LOCKED" }, { status: 400 });
  }
  try {
    updateQuestion(Number(id), parsed.data);
  } catch (e) {
    if ((e as Error).message.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "POSITION_TAKEN", issues: [{ message: "มีข้อสอบที่ลำดับนี้อยู่แล้ว" }] },
        { status: 409 },
      );
    }
    throw e;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const existing = getQuestion(Number(id));
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const outcome = deleteQuestion(Number(id));
  return NextResponse.json({ ok: true, outcome });
}
