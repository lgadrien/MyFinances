/**
 * src/lib/auth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Signed, expiring session tokens for MyFinances authentication.
 * Token = "<expiry ms>.<HMAC-SHA256(ACCESS_PASSWORD, expiry)>".
 * Uses Web Crypto API, compatible with Edge runtime and Node.js.
 */

export const AUTH_COOKIE_NAME = "access_token";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

async function sign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`myfinances-auth-v2:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Creates a session token that expires after SESSION_MAX_AGE_S. */
export async function createSessionToken(secret: string, now = Date.now()): Promise<string> {
  const expiry = String(now + SESSION_MAX_AGE_S * 1000);
  return `${expiry}.${await sign(secret, expiry)}`;
}

/** True when the token was signed with this secret and has not expired. */
export async function verifySessionToken(
  secret: string,
  token: string,
  now = Date.now(),
): Promise<boolean> {
  const [expiry, sig] = token.split(".");
  if (!expiry || !sig || !(Number(expiry) > now)) return false;
  return sig === (await sign(secret, expiry));
}
