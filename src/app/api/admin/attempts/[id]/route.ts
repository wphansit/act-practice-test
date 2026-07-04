import { NextResponse, type NextRequest } from "next/server";
import { deleteAttempt, getAttempt } from "@/lib/dal/attempts";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!getAttempt(id)) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  deleteAttempt(id);
  return NextResponse.json({ ok: true });
}
