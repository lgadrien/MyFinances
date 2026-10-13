import { describe, it, expect } from "vitest";
import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE_S,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth";

describe("Authentication & Crypto Security", () => {
  it("uses the standard cookie name", () => {
    expect(AUTH_COOKIE_NAME).toBe("access_token");
  });

  it("accepts a fresh token signed with the right secret", async () => {
    const token = await createSessionToken("my-super-secret-password");
    expect(await verifySessionToken("my-super-secret-password", token)).toBe(true);
  });

  it("rejects a token signed with another secret", async () => {
    const token = await createSessionToken("password123");
    expect(await verifySessionToken("password124", token)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const now = Date.now();
    const token = await createSessionToken("secret", now);
    const later = now + SESSION_MAX_AGE_S * 1000 + 1;
    expect(await verifySessionToken("secret", token, later)).toBe(false);
  });

  it("rejects a token whose expiry was tampered with", async () => {
    const token = await createSessionToken("secret");
    const [, sig] = token.split(".");
    const forged = `${Date.now() + 10 * 365 * 24 * 3600 * 1000}.${sig}`;
    expect(await verifySessionToken("secret", forged)).toBe(false);
    expect(await verifySessionToken("secret", "garbage")).toBe(false);
  });
});
