import { NextRequest, NextResponse } from "next/server";

// In-memory cache with 2-minute TTL
const cache = new Map<string, { data: StockQuote; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

/**
 * Fetches live stock quotes from Yahoo Finance public API.
 * No API key required, generous rate limits.
 */
export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json(
      { error: "Missing ticker parameter" },
      { status: 400 },
    );
  }

  // Check cache first
  const cached = cache.get(ticker);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // Yahoo Finance v8 API — public, no key needed
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=5m&includePrePost=false`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 120 },
    });

    if (!res.ok) {
      console.error(`Yahoo Finance error for ${ticker}: ${res.status}`);
      return NextResponse.json(getFallbackQuote(ticker));
    }

    const data = await res.json();
    const result = data?.chart?.result?.[0];

    if (!result?.meta) {
      return NextResponse.json(getFallbackQuote(ticker));
    }

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice ?? 0;
    const previousClose =
      meta.chartPreviousClose ?? meta.previousClose ?? currentPrice;
    const change = currentPrice - previousClose;
    const changePercent =
      previousClose > 0 ? (change / previousClose) * 100 : 0;

    const stockQuote: StockQuote = {
      ticker,
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      lastUpdated: new Date().toISOString(),
    };

    // Store in cache
    cache.set(ticker, { data: stockQuote, timestamp: Date.now() });

    return NextResponse.json(stockQuote);
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return NextResponse.json(getFallbackQuote(ticker));
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
