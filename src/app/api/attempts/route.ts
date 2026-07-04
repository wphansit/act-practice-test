import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ATTEMPT_COOKIE, attemptCookieValue } from "@/lib/auth";
import { createAttempt } from "@/lib/dal/attempts";

const bodySchema = z.object({
  studentName: z.string().trim().min(1).max(50),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_NAME" }, { status: 400 });
  }
  const { id, token } = createAttempt(parsed.data.studentName);
  const res = NextResponse.json({ attemptId: id });
  res.cookies.set(ATTEMPT_COOKIE, attemptCookieValue(id, token), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // the exam runs ~3h; 12h leaves room for breaks
  });
  return res;
}
