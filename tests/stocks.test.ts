import { describe, it, expect, vi, afterEach } from "vitest";

// No Next.js cache in unit tests: run the fetcher directly
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

import { getStockQuote, getBatchStockQuotes } from "@/lib/stocks";

function yahooResponse(meta: Record<string, unknown>) {
  return new Response(JSON.stringify({ chart: { result: [{ meta }] } }));
}

afterEach(() => vi.unstubAllGlobals());

describe("Stock quotes", () => {
  it("never turns a Yahoo failure into a 0 € price", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));

    await expect(getStockQuote("MC.PA")).rejects.toThrow();
    expect(await getBatchStockQuotes(["MC.PA"])).toEqual({});
  });

  it("keeps EUR quotes as is", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        yahooResponse({ regularMarketPrice: 700, chartPreviousClose: 650, currency: "EUR" }),
      ),
    );

    const q = await getStockQuote("mc.pa");
    expect(q).toMatchObject({ ticker: "MC.PA", price: 700, change: 50, currency: "EUR" });
  });

  it("converts non-EUR quotes to EUR with the live FX rate", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("USDEUR%3DX")
          ? yahooResponse({ regularMarketPrice: 0.9, currency: "EUR" })
          : yahooResponse({ regularMarketPrice: 200, chartPreviousClose: 190, currency: "USD" }),
      ),
    );

    const q = await getStockQuote("AAPL");
    expect(q).toMatchObject({ price: 180, change: 9, currency: "USD" });
    expect(q.changePercent).toBeCloseTo(5.26, 2);
  });

  it("fails the quote when the FX rate is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("USDEUR%3DX")
          ? new Response("", { status: 503 })
          : yahooResponse({ regularMarketPrice: 200, currency: "USD" }),
      ),
    );

    await expect(getStockQuote("AAPL")).rejects.toThrow();
  });
});
