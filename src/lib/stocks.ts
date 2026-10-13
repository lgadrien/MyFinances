import { unstable_cache } from "next/cache";

const FETCH_TIMEOUT_MS = 6_000; // 6 s — Yahoo Finance can be slow

export interface StockQuote {
  ticker: string;
  /** Converted to EUR, except FX pairs (=X) and indices (^), which keep Yahoo's value. */
  price: number;
  change: number;
  changePercent: number;
  /** Currency of the original Yahoo quote (e.g. "USD"). */
  currency: string;
  lastUpdated: string;
}

/**
 * Throws when Yahoo fails, so the failure is never cached nor shown as a 0 € price.
 */
export async function getStockQuote(ticker: string): Promise<StockQuote> {
  const normalised = ticker.trim().toUpperCase();
  if (!normalised) throw new Error("Empty ticker");

  const getQuote = unstable_cache(
    async (t: string): Promise<StockQuote> => {
      const url =
        `https://query1.finance.yahoo.com/v8/finance/chart/` +
        `${encodeURIComponent(t)}?range=1d&interval=5m&includePrePost=false`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`Yahoo ${res.status} for ${t}`);

      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      const currentPrice = meta?.regularMarketPrice;
      if (typeof currentPrice !== "number" || currentPrice <= 0) {
        throw new Error(`No price for ${t}`);
      }

      const previousClose: number =
        meta.chartPreviousClose ?? meta.previousClose ?? currentPrice;
      const currency: string = meta.currency ?? "EUR";
      const isFxOrIndex = t.endsWith("=X") || t.startsWith("^");
      // shortcut: GBp (pence) quotes fail on the FX lookup and show as missing; handle /100 if UK stocks are ever held.
      const fx =
        currency === "EUR" || isFxOrIndex
          ? 1
          : (await getStockQuote(`${currency}EUR=X`)).price;

      const change = currentPrice - previousClose;
      return {
        ticker: t,
        price: round2(currentPrice * fx),
        change: round2(change * fx),
        changePercent: round2(previousClose > 0 ? (change / previousClose) * 100 : 0),
        currency,
        lastUpdated: new Date().toISOString(),
      };
    },
    [`stock-quote-${normalised}`],
    {
      revalidate: 120, // 2 minutes
      tags: [`stock-${normalised}`],
    },
  );

  return getQuote(normalised);
}

/**
 * Fetch quotes for multiple tickers in server-side batches.
 * Tickers whose quote failed are left out of the result.
 */
export async function getBatchStockQuotes(
  tickers: string[],
  concurrency = 8,
): Promise<Record<string, StockQuote>> {
  const uniqueTickers = Array.from(new Set(tickers.map((t) => t.trim().toUpperCase()))).filter(Boolean);
  const results: Record<string, StockQuote> = {};

  for (let i = 0; i < uniqueTickers.length; i += concurrency) {
    const chunk = uniqueTickers.slice(i, i + concurrency);
    const chunkResults = await Promise.allSettled(chunk.map((t) => getStockQuote(t)));

    chunkResults.forEach((res, idx) => {
      if (res.status === "fulfilled") {
        results[chunk[idx]] = res.value;
      } else {
        console.error(`[stocks] Failed to fetch ${chunk[idx]}:`, res.reason);
      }
    });
  }

  return results;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
