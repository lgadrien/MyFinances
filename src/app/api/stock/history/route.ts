import { NextRequest, NextResponse } from "next/server";

// Cache historical data for 10 minutes
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000;

/**
 * Maps our interval labels to Yahoo Finance range/interval params.
 */
function getYahooParams(interval: string): {
  range: string;
  yahooInterval: string;
} {
  switch (interval) {
    case "5min":
      return { range: "1d", yahooInterval: "5m" };
    case "15min":
      return { range: "5d", yahooInterval: "15m" };
    case "60min":
      return { range: "1mo", yahooInterval: "60m" };
    case "weekly":
      return { range: "1y", yahooInterval: "1wk" };
    case "daily":
    default:
      return { range: "3mo", yahooInterval: "1d" };
  }
}

/**
 * Fetches historical price data from Yahoo Finance.
 * No API key required.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  const interval = searchParams.get("interval") || "daily";

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
  }

  const cacheKey = `${ticker}:${interval}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const { range, yahooInterval } = getYahooParams(interval);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${yahooInterval}&includePrePost=false`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance history error: ${response.status}`);
      const mockData = generateMockHistory(interval);
      return NextResponse.json({
        ticker,
        interval,
        data: mockData,
        mock: true,
      });
    }

    const json = await response.json();
    const chartResult = json?.chart?.result?.[0];

    if (!chartResult?.timestamp || !chartResult?.indicators?.quote?.[0]) {
      const mockData = generateMockHistory(interval);
      return NextResponse.json({
        ticker,
        interval,
        data: mockData,
        mock: true,
      });
    }

    const timestamps = chartResult.timestamp;
    const quote = chartResult.indicators.quote[0];

    const data = timestamps
      .map((ts: number, i: number) => {
        const open = quote.open?.[i];
        const high = quote.high?.[i];
        const low = quote.low?.[i];
        const close = quote.close?.[i];
        const volume = quote.volume?.[i];

        // Skip null entries (market closed, etc.)
        if (close === null || close === undefined) return null;

        const date = new Date(ts * 1000);
        const dateStr =
          yahooInterval.includes("m") || yahooInterval === "60m"
            ? date.toISOString().slice(0, 16).replace("T", " ")
            : date.toISOString().slice(0, 10);

        return {
          date: dateStr,
          open: parseFloat((open ?? close).toFixed(2)),
          high: parseFloat((high ?? close).toFixed(2)),
          low: parseFloat((low ?? close).toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: volume || 0,
        };
      })
      .filter(Boolean);

    const result = { ticker, interval, data, mock: false };
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching history:", error);
    const mockData = generateMockHistory(interval);
    return NextResponse.json({ ticker, interval, data: mockData, mock: true });
  }
}

function generateMockHistory(interval: string) {
  const points = interval === "weekly" ? 52 : interval === "daily" ? 60 : 50;
  const now = Date.now();
  let stepMs: number;

  switch (interval) {
    case "5min":
      stepMs = 5 * 60 * 1000;
      break;
    case "15min":
      stepMs = 15 * 60 * 1000;
      break;
    case "60min":
      stepMs = 60 * 60 * 1000;
      break;
    case "weekly":
      stepMs = 7 * 24 * 60 * 60 * 1000;
      break;
    default:
      stepMs = 24 * 60 * 60 * 1000;
  }

  let price = 100 + Math.random() * 100;
  return Array.from({ length: points }, (_, i) => {
    const change = (Math.random() - 0.48) * 3;
    price = Math.max(10, price + change);
    const open = price - (Math.random() - 0.5) * 2;
    const high = Math.max(price, open) + Math.random() * 2;
    const low = Math.min(price, open) - Math.random() * 2;

    const date = new Date(now - (points - i) * stepMs);
    const dateStr =
      stepMs < 24 * 60 * 60 * 1000
        ? date.toISOString().slice(0, 16).replace("T", " ")
        : date.toISOString().slice(0, 10);

    return {
      date: dateStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 100000,
    };
  });
}
