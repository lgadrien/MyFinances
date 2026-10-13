import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { sanitizeTicker } from "@/lib/validation";

/**
 * Maps our interval labels to Yahoo Finance range/interval params.
 */
const YAHOO_PARAMS: Record<string, { range: string; yahooInterval: string }> = {
  "5min": { range: "1d", yahooInterval: "5m" },
  "15min": { range: "5d", yahooInterval: "15m" },
  "60min": { range: "1mo", yahooInterval: "60m" },
  daily: { range: "3mo", yahooInterval: "1d" },
  weekly: { range: "1y", yahooInterval: "1wk" },
};

/**
 * Fetches historical price data from Yahoo Finance.
 * No API key required. Throws on failure so errors are never cached.
 */
const getHistory = unstable_cache(
  async (t: string, i: string) => {
    const { range, yahooInterval } = YAHOO_PARAMS[i];
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?range=${range}&interval=${yahooInterval}&includePrePost=false`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!response.ok) throw new Error(`Yahoo history ${response.status} for ${t}`);

    const json = await response.json();
    const chartResult = json?.chart?.result?.[0];
    if (!chartResult?.timestamp || !chartResult?.indicators?.quote?.[0]) {
      throw new Error(`No history for ${t}`);
    }

    const timestamps = chartResult.timestamp;
    const quote = chartResult.indicators.quote[0];

    const data = timestamps
      .map((ts: number, idx: number) => {
        const open = quote.open?.[idx];
        const high = quote.high?.[idx];
        const low = quote.low?.[idx];
        const close = quote.close?.[idx];
        const volume = quote.volume?.[idx];

        if (close === null || close === undefined) return null;

        const date = new Date(ts * 1000);
        const dateStr = yahooInterval.endsWith("m")
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

    return { ticker: t, interval: i, data };
  },
  ["stock-history"],
  { revalidate: 600 }, // 10 minutes cache
);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const ticker = sanitizeTicker(searchParams.get("ticker"));
  const interval = searchParams.get("interval") || "daily";

  if (!ticker || !Object.hasOwn(YAHOO_PARAMS, interval)) {
    return NextResponse.json({ error: "Ticker ou intervalle invalide" }, { status: 400 });
  }

  try {
    return NextResponse.json(await getHistory(ticker, interval));
  } catch (error) {
    console.error("[stock/history]", error);
    return NextResponse.json({ ticker, interval, data: [] }, { status: 502 });
  }
}
