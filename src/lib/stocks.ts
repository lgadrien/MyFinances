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

/** Fetches a live stock quote from Yahoo Finance with caching & timeout. */
export async function getStockQuote(ticker: string): Promise<StockQuote> {
  const normalised = ticker.trim().toUpperCase();
  if (!normalised) return getFallbackQuote(ticker);

  // Return cached value if still fresh
  const cached = cache.get(normalised);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/` +
      `${encodeURIComponent(normalised)}?range=1d&interval=5m&includePrePost=false`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      // Next.js ISR: revalidate every 2 min at the CDN level
      next: { revalidate: 120 },
    });

    if (!res.ok) return getFallbackQuote(normalised);

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return getFallbackQuote(normalised);

    const currentPrice: number = meta.regularMarketPrice ?? 0;
    const previousClose: number =
      meta.chartPreviousClose ?? meta.previousClose ?? currentPrice;
    const change = currentPrice - previousClose;
    const changePercent =
      previousClose > 0 ? (change / previousClose) * 100 : 0;

    const quote: StockQuote = {
      ticker: normalised,
      price: round2(currentPrice),
      change: round2(change),
      changePercent: round2(changePercent),
      lastUpdated: new Date().toISOString(),
    };

    cache.set(normalised, { data: quote, timestamp: Date.now() });
    return quote;
  } catch (error) {
    // AbortError = timeout, NetworkError = no connectivity — both non-fatal
    console.error(`[stocks] Failed to fetch ${normalised}:`, error);
    return getFallbackQuote(normalised);
  }
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
