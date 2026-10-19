import { NextRequest, NextResponse } from "next/server";
import { getBatchStockQuotes } from "@/lib/stocks";
import { sanitizeTicker } from "@/lib/validation";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireSession(); if (denied) return denied;
  const tickersParam = request.nextUrl.searchParams.get("tickers");

  if (!tickersParam) {
    return NextResponse.json(
      { error: "Missing tickers parameter" },
      { status: 400 },
    );
  }

  const tickers = tickersParam
    .split(",")
    .map((t) => sanitizeTicker(t))
    .filter((t): t is string => t !== null);

  if (tickers.length === 0) {
    return NextResponse.json({ quotes: {} });
  }

  const quotes = await getBatchStockQuotes(tickers);
  return NextResponse.json({ quotes });
}

export async function POST(request: NextRequest) {
  const denied = await requireSession(); if (denied) return denied;
  try {
    const body = await request.json();
    const rawTickers: unknown[] = Array.isArray(body?.tickers) ? body.tickers : [];
    const tickers = rawTickers
      .map((t) => sanitizeTicker(t))
      .filter((t: string | null): t is string => t !== null);

    if (tickers.length === 0) {
      return NextResponse.json({ quotes: {} });
    }

    const quotes = await getBatchStockQuotes(tickers);
    return NextResponse.json({ quotes });
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }
}
