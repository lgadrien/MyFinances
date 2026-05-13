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
      // 1. Essayer Yahoo Finance (standard)
      let quote = await fetchFromYahoo(t);
      if (quote && quote.price > 0) return quote;

      // 2. Essayer Yahoo Finance avec suffixe -USD (pour crypto standard)
      if (!t.includes("-")) {
        quote = await fetchFromYahoo(`${t}-USD`);
        if (quote && quote.price > 0) {
          return { ...quote, ticker: t }; // Garder le ticker original
        }
      }

      // 3. Essayer CoinGecko (pour tokens spécifiques / staking)
      quote = await fetchFromCoinGecko(t);
      if (quote && quote.price > 0) return quote;

      return getFallbackQuote(t);
    },
    [`stock-quote-${normalised}`],
    {
      revalidate: 120, // 2 minutes
      tags: [`stock-${normalised}`],
    }
  );

  return getQuote(normalised);
}

async function fetchFromYahoo(ticker: string): Promise<StockQuote | null> {
  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/` +
      `${encodeURIComponent(ticker)}?range=1d&interval=5m&includePrePost=false`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== "number") return null;

    const currentPrice: number = meta.regularMarketPrice;
    const previousClose: number =
      meta.chartPreviousClose ?? meta.previousClose ?? currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      ticker,
      price: round2(currentPrice),
      change: round2(change),
      changePercent: round2(changePercent),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[Yahoo] Failed for ${ticker}:`, error);
    return null;
  }
}

async function fetchFromCoinGecko(ticker: string): Promise<StockQuote | null> {
  const mapping: Record<string, string> = {
    LDSOL: "lido-staked-sol",
    LDASTER: "liquid-staking-astar",
    STSOL: "lido-staked-sol",
    STETH: "staked-ether",
    AAVE: "aave",
    SOL: "solana",
    ASTR: "astar",
    DOT: "polkadot",
    MATIC: "matic-network",
  };

  const id = mapping[ticker.toUpperCase()] || ticker.toLowerCase();

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data[id] || typeof data[id].usd !== "number") return null;

    const price = data[id].usd;
    const changePercent = data[id].usd_24h_change || 0;
    const change = (price * changePercent) / 100;

    return {
      ticker,
      price: round2(price),
      change: round2(change),
      changePercent: round2(changePercent),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[CoinGecko] Failed for ${ticker}:`, error);
    return null;
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
