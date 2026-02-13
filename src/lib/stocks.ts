import { createClient } from "@supabase/supabase-js";

// Create cache map for server-side caching
const cache = new Map<string, { data: StockQuote; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

/**
 * Fetches live stock quote from Yahoo Finance
 */
export async function getStockQuote(ticker: string): Promise<StockQuote> {
  // Check cache
  const cached = cache.get(ticker);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=5m&includePrePost=false`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 120 },
    });

    if (!res.ok) return getFallbackQuote(ticker);

    const data = await res.json();
    const result = data?.chart?.result?.[0]?.meta;

    if (!result) return getFallbackQuote(ticker);

    const currentPrice = result.regularMarketPrice ?? 0;
    const previousClose =
      result.chartPreviousClose ?? result.previousClose ?? currentPrice;
    const change = currentPrice - previousClose;
    const changePercent =
      previousClose > 0 ? (change / previousClose) * 100 : 0;

    const quote: StockQuote = {
      ticker,
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      lastUpdated: new Date().toISOString(),
    };

    cache.set(ticker, { data: quote, timestamp: Date.now() });
    return quote;
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return getFallbackQuote(ticker);
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
