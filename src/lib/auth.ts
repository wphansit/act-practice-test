// Session/cookie helpers. Web Crypto only (no node:crypto) so the same code
// runs in route handlers AND edge middleware.

export const ATTEMPT_COOKIE = "act_attempt";
export const ADMIN_COOKIE = "act_admin";
export const ADMIN_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Timing-safe-enough string equality: compare fixed-length digests instead of
 * the raw values so comparison time reveals nothing about the secret.
 */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  return ha === hb;
}

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env var is not set");
  return secret;
}

// ---------- Admin session ----------

export async function signAdminSession(): Promise<string> {
  const exp = String(Date.now() + ADMIN_SESSION_TTL_MS);
  return `${exp}.${await hmacHex(sessionSecret(), exp)}`;
}

export async function verifyAdminSession(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const dot = cookieValue.indexOf(".");
  if (dot < 0) return false;
  const exp = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return safeEqual(await hmacHex(sessionSecret(), exp), sig);
}

export async function verifyPasscode(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) return false;
  return safeEqual(input, expected);
}

// ---------- Attempt ownership (no accounts) ----------

export function attemptCookieValue(attemptId: string, token: string): string {
  return `${attemptId}.${token}`;
}

export async function verifyAttemptCookie(
  cookieValue: string | undefined,
  attemptId: string,
  expectedToken: string,
): Promise<boolean> {
  if (!cookieValue) return false;
  const dot = cookieValue.indexOf(".");
  if (dot < 0) return false;
  if (cookieValue.slice(0, dot) !== attemptId) return false;
  return safeEqual(cookieValue.slice(dot + 1), expectedToken);
}
