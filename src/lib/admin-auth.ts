/**
 * Auth do painel admin — Web Crypto (Edge + Node), sem node:crypto.
 */

const COOKIE_NAME = "love365_admin";
const COOKIE_MAX_AGE = 60 * 60 * 12; // 12h
const SESSION_MESSAGE = "love365-admin-session-v1";

function getAdminSecret(): string | null {
  const s = process.env.ADMIN_SECRET?.trim();
  return s || null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha256Hex(
  secret: string,
  message: string
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return "";

  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createAdminSessionToken(): Promise<string | null> {
  const secret = getAdminSecret();
  if (!secret) return null;
  return hmacSha256Hex(secret, SESSION_MESSAGE);
}

export async function verifyAdminSessionToken(
  token: string | null | undefined
): Promise<boolean> {
  const expected = await createAdminSessionToken();
  if (!expected || !token) return false;
  return timingSafeEqual(token, expected);
}

export function parseAdminCookie(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === COOKIE_NAME) {
      return rest.join("=");
    }
  }
  return null;
}

export async function isAdminAuthorized(
  req: Request
): Promise<boolean> {
  return verifyAdminSessionToken(
    parseAdminCookie(req.headers.get("cookie"))
  );
}

export async function buildAdminSessionCookie(): Promise<string | null> {
  const token = await createAdminSessionToken();
  if (!token) return null;
  const secure =
    process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export function verifyAdminPassword(password: string): boolean {
  const secret = getAdminSecret();
  if (!secret || !password) return false;
  return timingSafeEqual(password, secret);
}
