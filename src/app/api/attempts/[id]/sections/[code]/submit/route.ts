import { NextResponse, type NextRequest } from "next/server";
import { getAttempt, getAttemptSection, getAttemptSections } from "@/lib/dal/attempts";
import { isSectionCode } from "@/lib/exam/definition";
import { gradeAndSubmitSection } from "@/lib/exam/enforce";
import { requireAttempt } from "@/lib/exam/guard";

/**
 * Submit a section (manual click or client-side timeout). Idempotent. Scores
 * are computed server-side and NOT returned — the ACT reveals nothing until
 * the whole exam is finished.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string; code: string }> }) {
  const { id, code } = await ctx.params;
  if (!isSectionCode(code)) {
    return NextResponse.json({ error: "UNKNOWN_SECTION" }, { status: 404 });
  }
  const guard = await requireAttempt(req, id);
  if ("error" in guard) return guard.error;

  const target = getAttemptSection(id, code);
  if (!target) {
    return NextResponse.json({ error: "SECTION_NOT_FOUND" }, { status: 404 });
  }
  if (target.status === "not_started") {
    return NextResponse.json({ error: "SECTION_NOT_STARTED" }, { status: 409 });
  }

  gradeAndSubmitSection(id, code);

  const attempt = getAttempt(id)!;
  const next = getAttemptSections(id).find((s) => s.status !== "submitted");
  return NextResponse.json({
    ok: true,
    attemptCompleted: attempt.status === "completed",
    nextSectionPosition: next?.position ?? null,
  });
}
