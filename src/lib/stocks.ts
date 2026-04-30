import { unstable_cache } from "next/cache";

// Server-side in-process cache (2 min TTL — suitable for a single-instance server)
const cache = new Map<string, { data: StockQuote; timestamp: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const FETCH_TIMEOUT_MS = 6_000; // 6 s — Yahoo Finance can be slow

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export async function getStockQuote(ticker: string): Promise<StockQuote> {
  const normalised = ticker.trim().toUpperCase();
  if (!normalised) return getFallbackQuote(ticker);

  const getQuote = unstable_cache(
    async (t: string) => {
      try {
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

        if (!res.ok) return getFallbackQuote(t);

        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) return getFallbackQuote(t);

        const currentPrice: number = meta.regularMarketPrice ?? 0;
        const previousClose: number =
          meta.chartPreviousClose ?? meta.previousClose ?? currentPrice;
        const change = currentPrice - previousClose;
        const changePercent =
          previousClose > 0 ? (change / previousClose) * 100 : 0;

        const quote: StockQuote = {
          ticker: t,
          price: round2(currentPrice),
          change: round2(change),
          changePercent: round2(changePercent),
          lastUpdated: new Date().toISOString(),
        };

        return quote;
      } catch (error) {
        console.error(`[stocks] Failed to fetch ${t}:`, error);
        return getFallbackQuote(t);
      }
    },
    [`stock-quote-${normalised}`],
    {
      revalidate: 120, // 2 minutes
      tags: [`stock-${normalised}`],
    }
  );

  return getQuote(normalised);
}

function getFallbackQuote(ticker: string): StockQuote {
  return {
    ticker,
    price: 0,
    change: 0,
    changePercent: 0,
    lastUpdated: new Date().toISOString(),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
