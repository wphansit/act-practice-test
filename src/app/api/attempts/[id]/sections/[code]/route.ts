import { NextResponse, type NextRequest } from "next/server";
import { getAttemptSection } from "@/lib/dal/attempts";
import { isSectionCode } from "@/lib/exam/definition";
import { requireAttempt } from "@/lib/exam/guard";
import { sectionRunnerPayload } from "@/lib/exam/payload";

type Ctx = { params: Promise<{ id: string; code: string }> };

/** Resume/resync: full runner payload with the original deadline. */
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id, code } = await ctx.params;
  if (!isSectionCode(code)) {
    return NextResponse.json({ error: "UNKNOWN_SECTION" }, { status: 404 });
  }
  const guard = await requireAttempt(req, id);
  if ("error" in guard) return guard.error;

  const target = getAttemptSection(id, code);
  if (!target || target.status !== "in_progress") {
    return NextResponse.json(
      { error: "SECTION_NOT_OPEN", status: target?.status ?? "missing" },
      { status: 409 },
    );
  }
  return NextResponse.json(sectionRunnerPayload(id, target));
}
