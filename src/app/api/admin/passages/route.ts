import { NextResponse, type NextRequest } from "next/server";
import { passageInputSchema } from "@/lib/admin-schemas";
import { createPassage, listPassages } from "@/lib/dal/questions";
import { isSectionCode, type SectionCode } from "@/lib/exam/definition";

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section");
  return NextResponse.json(
    listPassages(section && isSectionCode(section) ? (section as SectionCode) : undefined),
  );
}

export async function POST(req: NextRequest) {
  const parsed = passageInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const id = createPassage(parsed.data);
  return NextResponse.json({ id }, { status: 201 });
}
