import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchTransactions } from "@/lib/data";
import { calculatePortfolioPositions } from "@/lib/calculations";
import { FRENCH_INSTRUMENTS } from "@/lib/french-instruments";
import { getStockQuote } from "@/lib/stocks";

export const dynamic = "force-dynamic"; // Prevent static caching

export async function GET(request: Request) {
  // Check for Vercel Cron Secret if environment variable is set
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  try {
    // 1. Fetch all transactions
    const transactions = await fetchTransactions();
    if (!transactions.length) {
      return NextResponse.json({ message: "No transactions found" });
    }

    // 2. Prepare instrument lookup
    const instrumentMap = new Map<string, { name: string; sector: string }>();
    FRENCH_INSTRUMENTS.forEach((i) => {
      instrumentMap.set(i.ticker, { name: i.name, sector: i.sector });
    });

    // 3. Calculate positions
    const positions = calculatePortfolioPositions(transactions, instrumentMap);

    // Filter active positions
    const activePositions = positions.filter((p) => p.totalQuantity > 0.0001);

    // 4. Get live prices and calculate total value
    let totalValue = 0;
    const totalInvested = activePositions.reduce(
      (sum, p) => sum + p.totalInvested,
      0,
    );

    await Promise.allSettled(
      activePositions.map(async (pos) => {
        const quote = await getStockQuote(pos.ticker);
        const currentPrice = quote.price ?? 0;
        totalValue += currentPrice * pos.totalQuantity;
      }),
    );

    // 5. Insert into portfolio_history
    // Check if entry already exists for today to avoid duplicates (or upsert)
    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("portfolio_history").upsert(
      {
        date: today,
        total_value: totalValue,
        total_invested: totalInvested,
      },
      { onConflict: "date" },
    );

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      date: today,
      totalValue,
      totalInvested,
    });
  } catch (error) {
    console.error("Snapshot error:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 },
    );
  }
}
