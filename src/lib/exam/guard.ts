import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ATTEMPT_COOKIE, verifyAttemptCookie } from "../auth";
import { getAttempt, type AttemptRow } from "../dal/attempts";
import { enforceDeadlines } from "./enforce";

export type AttemptGuardResult = { attempt: AttemptRow } | { error: NextResponse };

/**
 * API-route guard: 404 unknown attempt, 403 missing/foreign cookie. Runs
 * deadline enforcement and re-reads the attempt so callers always see
 * post-enforcement state.
 */
export async function requireAttempt(
  req: NextRequest,
  attemptId: string,
): Promise<AttemptGuardResult> {
  const attempt = getAttempt(attemptId);
  if (!attempt) {
    return { error: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) };
  }
  const cookieValue = req.cookies.get(ATTEMPT_COOKIE)?.value;
  if (!(await verifyAttemptCookie(cookieValue, attemptId, attempt.token))) {
    return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }
  enforceDeadlines(attemptId);
  return { attempt: getAttempt(attemptId)! };
}

/**
 * Server-component variant (pages read cookies via next/headers). Returns the
 * attempt when the visitor owns it, null otherwise.
 */
export async function getOwnedAttempt(attemptId: string): Promise<AttemptRow | null> {
  const attempt = getAttempt(attemptId);
  if (!attempt) return null;
  const store = await cookies();
  const cookieValue = store.get(ATTEMPT_COOKIE)?.value;
  if (!(await verifyAttemptCookie(cookieValue, attemptId, attempt.token))) return null;
  enforceDeadlines(attemptId);
  return getAttempt(attemptId) ?? null;
}
