import { NextResponse, type NextRequest } from "next/server";
import { requireAttempt } from "@/lib/exam/guard";
import { attemptStatePayload } from "@/lib/exam/payload";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireAttempt(req, id);
  if ("error" in guard) return guard.error;
  return NextResponse.json(attemptStatePayload(guard.attempt));
}
