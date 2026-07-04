import { NextResponse, type NextRequest } from "next/server";
import { requireAttempt } from "@/lib/exam/guard";
import { resultPayload } from "@/lib/exam/payload";

/**
 * Score report + full answer key. This is the ONLY exam-facing route that
 * returns correct answers, and only once the attempt is completed.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireAttempt(req, id);
  if ("error" in guard) return guard.error;
  if (guard.attempt.status !== "completed") {
    return NextResponse.json({ error: "ATTEMPT_NOT_COMPLETED" }, { status: 403 });
  }
  return NextResponse.json(resultPayload(guard.attempt));
}
