import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import proxy, { config } from "@/proxy";
import { AUTH_COOKIE_NAME, createSessionToken } from "@/lib/auth";

const SECRET = "test-access-password";
beforeAll(() => {
  process.env.ACCESS_PASSWORD = SECRET;
});

function request(path: string, token?: string) {
  const req = new NextRequest(`http://localhost${path}`);
  if (token) req.cookies.set(AUTH_COOKIE_NAME, token);
  return req;
}

describe("proxy", () => {
  it("skips the PWA files, which browsers fetch without cookies", () => {
    for (const url of ["/manifest.webmanifest", "/icon/192", "/icon/512", "/apple-icon"]) {
      expect(unstable_doesMiddlewareMatch({ config, url }), url).toBe(false);
    }
    for (const url of ["/", "/portefeuille", "/api/transactions", "/api/stock?ticker=MC.PA"]) {
      expect(unstable_doesMiddlewareMatch({ config, url }), url).toBe(true);
    }
  });

  it("rejects API calls without a valid session", async () => {
    expect((await proxy(request("/api/transactions"))).status).toBe(401);
    expect((await proxy(request("/api/transactions", "9999999999999.forged"))).status).toBe(401);
  });

  it("redirects pages to the login form, keeping the destination", async () => {
    const res = await proxy(request("/portefeuille"));
    expect(res.headers.get("location")).toBe("http://localhost/login?from=%2Fportefeuille");
  });

  it("lets a valid session through", async () => {
    const res = await proxy(request("/api/transactions", await createSessionToken(SECRET)));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
