import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, ADMIN_SESSION_TTL_MS, signAdminSession, verifyPasscode } from "@/lib/auth";

// Single-admin tool → one global limiter is enough. 5 fails = 1-minute lock.
const limiter = { fails: 0, lockedUntil: 0 };

const bodySchema = z.object({ passcode: z.string().min(1) });

export async function POST(req: NextRequest) {
  if (Date.now() < limiter.lockedUntil) {
    return NextResponse.json({ error: "LOCKED" }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }
  if (!(await verifyPasscode(parsed.data.passcode))) {
    limiter.fails += 1;
    if (limiter.fails >= 5) {
      limiter.fails = 0;
      limiter.lockedUntil = Date.now() + 60_000;
    }
    return NextResponse.json({ error: "WRONG_PASSCODE" }, { status: 401 });
  }
  limiter.fails = 0;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await signAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_MS / 1000,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
