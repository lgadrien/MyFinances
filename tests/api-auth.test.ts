import { describe, it, expect, vi, beforeAll } from "vitest";
import { NextRequest } from "next/server";

// API routes read the session through next/headers: these requests carry no cookie
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
// No Next.js cache in unit tests
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

beforeAll(() => {
  process.env.ACCESS_PASSWORD = "test-access-password";
});

describe("API routes", () => {
  const PUBLIC_ROUTES = ["auth/login", "auth/logout", "cron/snapshot"];
  const routes = import.meta.glob<Record<string, unknown>>("../src/app/api/**/route.ts");

  it("check the session themselves, in case the proxy is bypassed", async () => {
    const guarded = Object.keys(routes).filter((p) => !PUBLIC_ROUTES.some((r) => p.includes(`/${r}/`)));
    expect(guarded.length).toBeGreaterThan(5);

    for (const path of guarded) {
      const mod = await routes[path]();
      for (const method of ["GET", "POST", "PUT", "DELETE"]) {
        const handler = mod[method];
        if (typeof handler !== "function") continue;
        const res = await handler(new NextRequest("http://localhost/api/x"), { params: Promise.resolve({ id: "x" }) });
        expect(res.status, `${method} ${path}`).toBe(401);
      }
    }
  });
});
