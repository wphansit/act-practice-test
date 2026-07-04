import { NextResponse, type NextRequest } from "next/server";
import { getAttemptSection, getAttemptSections, startSection } from "@/lib/dal/attempts";
import { effectiveDurationSeconds, isSectionCode } from "@/lib/exam/definition";
import { requireAttempt } from "@/lib/exam/guard";
import { sectionRunnerPayload } from "@/lib/exam/payload";

/** Start (or idempotently re-enter) a section. Enforces the fixed ACT order. */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; code: string }> },
) {
  const { id, code } = await ctx.params;
  if (!isSectionCode(code)) {
    return NextResponse.json({ error: "UNKNOWN_SECTION" }, { status: 404 });
  }
  const guard = await requireAttempt(req, id);
  if ("error" in guard) return guard.error;
  if (guard.attempt.status !== "in_progress") {
    return NextResponse.json({ error: "ATTEMPT_FINISHED" }, { status: 409 });
  }

  const sections = getAttemptSections(id);
  const target = sections.find((s) => s.section_code === code)!;
  if (target.status === "submitted") {
    return NextResponse.json({ error: "SECTION_ALREADY_SUBMITTED" }, { status: 409 });
  }
  const earlierUnfinished = sections.find(
    (s) => s.position < target.position && s.status !== "submitted",
  );
  if (earlierUnfinished) {
    return NextResponse.json(
      { error: "OUT_OF_ORDER", nextSection: earlierUnfinished.section_code },
      { status: 409 },
    );
  }

  if (target.status === "not_started") {
    const startedAt = new Date();
    const deadline = new Date(startedAt.getTime() + effectiveDurationSeconds(code) * 1000);
    startSection(id, code, startedAt.toISOString(), deadline.toISOString());
  }
  // Already in_progress → fall through and return the SAME deadline (idempotent).
  return NextResponse.json(sectionRunnerPayload(id, getAttemptSection(id, code)!));
}
