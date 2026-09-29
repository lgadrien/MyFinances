import { NextRequest, NextResponse } from "next/server";
import { getStockQuote } from "@/lib/stocks";
import { sanitizeTicker } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const rawTicker = request.nextUrl.searchParams.get("ticker");
  const ticker = sanitizeTicker(rawTicker);

  if (!ticker) {
    return NextResponse.json(
      { error: "Ticker invalide ou manquant" },
      { status: 400 },
    );
  }

  const quote = await getStockQuote(ticker);
  return NextResponse.json(quote);
}
