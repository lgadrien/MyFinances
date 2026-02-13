import { NextRequest, NextResponse } from "next/server";

interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
}

/**
 * Yahoo Finance autocomplete/search API.
 * Searches for tickers by name or symbol.
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=fr-FR&region=FR&quotesCount=10&newsCount=0&listsCount=0`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    const quotes = data?.quotes || [];

    const results: SearchResult[] = quotes
      .filter(
        (q: { quoteType?: string }) =>
          q.quoteType === "EQUITY" ||
          q.quoteType === "INDEX" ||
          q.quoteType === "ETF",
      )
      .map(
        (q: {
          symbol?: string;
          shortname?: string;
          longname?: string;
          exchange?: string;
          quoteType?: string;
        }) => ({
          ticker: q.symbol || "",
          name: q.shortname || q.longname || q.symbol || "",
          exchange: q.exchange || "",
          type: q.quoteType || "",
        }),
      );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] });
  }
}
