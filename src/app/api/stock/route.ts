import { NextRequest, NextResponse } from "next/server";
import { getStockQuote } from "@/lib/stocks";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json(
      { error: "Missing ticker parameter" },
      { status: 400 },
    );
  }

  const quote = await getStockQuote(ticker);
  return NextResponse.json(quote);
}
