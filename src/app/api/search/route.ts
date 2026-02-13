import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=5&newsCount=0&enableFuzzyQuery=false`;

    // Yahoo Finance Search API requires a User-Agent or it might bounce
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!res.ok) {
      throw new Error("Yahoo API error");
    }

    const data = await res.json();

    // Transform result
    const results = (data.quotes || [])
      .filter(
        (q: any) =>
          q.quoteType === "EQUITY" ||
          q.quoteType === "ETF" ||
          q.quoteType === "MUTUALFUND" ||
          q.quoteType === "INDEX",
      )
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchDisp: q.exchDisp,
        type: q.quoteType,
      }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
