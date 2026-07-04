import { NextResponse, type NextRequest } from "next/server";
import { questionInputSchema } from "@/lib/admin-schemas";
import { createQuestion, listQuestions } from "@/lib/dal/questions";
import { isSectionCode, type SectionCode } from "@/lib/exam/definition";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const section = sp.get("section");
  const result = listQuestions({
    section: section && isSectionCode(section) ? (section as SectionCode) : undefined,
    passageId: sp.get("passageId") ? Number(sp.get("passageId")) : undefined,
    topic: sp.get("topic") || undefined,
    search: sp.get("q") || undefined,
    page: sp.get("page") ? Number(sp.get("page")) : 1,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const parsed = questionInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    const id = createQuestion(parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    if ((e as Error).message.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "POSITION_TAKEN", issues: [{ message: "มีข้อสอบที่ลำดับนี้อยู่แล้ว" }] },
        { status: 409 },
      );
    }
    throw e;
  }
}
