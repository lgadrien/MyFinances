/**
 * src/lib/auth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Cryptographic token generator and validator for MyFinances session authentication.
 * Uses Web Crypto API (SHA-256) compatible with Edge runtime and Node.js.
 */

export const AUTH_COOKIE_NAME = "access_token";

/** Generates a deterministic SHA-256 session token from ACCESS_PASSWORD. */
export async function getExpectedToken(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`myfinances-auth-v1:${secret}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
