import crypto from "crypto";

const COOKIE_NAME = "love365_admin";
const COOKIE_MAX_AGE = 60 * 60 * 12; // 12h

function getAdminSecret(): string | null {
  const s = process.env.ADMIN_SECRET?.trim();
  return s || null;
}

export function createAdminSessionToken(): string | null {
  const secret = getAdminSecret();
  if (!secret) return null;
  return crypto
    .createHmac("sha256", secret)
    .update("love365-admin-session-v1")
    .digest("hex");
}

export function verifyAdminSessionToken(
  token: string | null | undefined
): boolean {
  const expected = createAdminSessionToken();
  if (!expected || !token) return false;
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
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

export function isAdminAuthorized(req: Request): boolean {
  return verifyAdminSessionToken(
    parseAdminCookie(req.headers.get("cookie"))
  );
}

export function buildAdminSessionCookie(): string | null {
  const token = createAdminSessionToken();
  if (!token) return null;
  const secure =
    process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export function verifyAdminPassword(
  password: string
): boolean {
  const secret = getAdminSecret();
  if (!secret || !password) return false;
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
