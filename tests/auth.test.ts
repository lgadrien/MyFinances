import { describe, it, expect } from "vitest";
import { getExpectedToken, AUTH_COOKIE_NAME } from "@/lib/auth";

describe("Authentication & Crypto Security", () => {
  it("uses the standard cookie name", () => {
    expect(AUTH_COOKIE_NAME).toBe("access_token");
  });

  it("generates deterministic 64-character SHA-256 tokens", async () => {
    const token1 = await getExpectedToken("my-super-secret-password");
    const token2 = await getExpectedToken("my-super-secret-password");

    expect(token1).toBe(token2);
    expect(token1).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(token1)).toBe(true);
  });

  it("generates distinct hashes for distinct secrets", async () => {
    const token1 = await getExpectedToken("password123");
    const token2 = await getExpectedToken("password124");

    expect(token1).not.toBe(token2);
  });
});
