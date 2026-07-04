import { NextResponse, type NextRequest } from "next/server";
import { passageInputSchema } from "@/lib/admin-schemas";
import { deletePassage, getPassage, updatePassage } from "@/lib/dal/questions";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const passage = getPassage(Number(id));
  if (!passage) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(passage);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!getPassage(Number(id))) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const parsed = passageInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  updatePassage(Number(id), parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!getPassage(Number(id))) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  try {
    deletePassage(Number(id));
  } catch {
    return NextResponse.json({ error: "PASSAGE_HAS_QUESTIONS" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
