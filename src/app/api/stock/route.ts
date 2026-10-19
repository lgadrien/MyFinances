import { NextRequest, NextResponse } from "next/server";
import { getStockQuote } from "@/lib/stocks";
import { sanitizeTicker } from "@/lib/validation";
import { requireSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const denied = await requireSession(); if (denied) return denied;
  const rawTicker = request.nextUrl.searchParams.get("ticker");
  const ticker = sanitizeTicker(rawTicker);

  if (!ticker) {
    return NextResponse.json(
      { error: "Ticker invalide ou manquant" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await getStockQuote(ticker));
  } catch (err) {
    console.error(`[stock] ${ticker}:`, err);
    return NextResponse.json({ error: "Cours indisponible" }, { status: 502 });
  }
}
