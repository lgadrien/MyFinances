import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { calculatePortfolioPositions } from "@/lib/calculations";
import { FRENCH_INSTRUMENTS } from "@/lib/french-instruments";
import { getStockQuote } from "@/lib/stocks";
import { mapTransactionRow } from "@/lib/validation";

export const dynamic = "force-dynamic"; // Prevent static caching

export async function GET(request: Request) {
  // CRON_SECRET est obligatoire — l'absence de la variable est une misconfiguration,
  // pas un mode "ouvert". Sans ce secret, n'importe qui pourrait déclencher des snapshots.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/snapshot] CRON_SECRET is not set — request rejected. Set it in your environment variables.");
    return new Response("Service misconfigured", { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 1. Fetch all transactions directly via supabaseAdmin (service_role bypasses RLS)
    //    On n'appelle pas /api/transactions pour éviter un self-call HTTP depuis le handler.
    const { data: txData, error: txError } = await supabaseAdmin
      .from("transactions")
      .select("id, ticker, type, date, quantity, unit_price, total_amount, fees, created_at")
      .order("date", { ascending: false });

    if (txError) {
      console.error("[cron/snapshot] Error fetching transactions:", txError);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    const transactions = (txData ?? []).map(mapTransactionRow);

    if (!transactions.length) {
      return NextResponse.json({ message: "No transactions found" });
    }

    // 2. Prepare instrument lookup
    const instrumentMap = new Map<string, { name: string; sector: string }>();
    FRENCH_INSTRUMENTS.forEach((i) => {
      instrumentMap.set(i.ticker, { name: i.name, sector: i.sector });
    });

    // 3. Calculate positions
    const activePositions = calculatePortfolioPositions(transactions, instrumentMap);

    // 4. Get live prices — a single missing quote aborts the snapshot,
    //    otherwise a Yahoo outage would be stored forever as a fake drop.
    const totalInvested = activePositions.reduce((sum, p) => sum + p.totalInvested, 0);

    const positionValues = await Promise.allSettled(
      activePositions.map(async (pos) => {
        const quote = await getStockQuote(pos.ticker);
        return quote.price * pos.totalQuantity;
      }),
    );

    const failed = activePositions
      .filter((_, i) => positionValues[i].status === "rejected")
      .map((p) => p.ticker);
    if (failed.length) {
      console.error("[cron/snapshot] Missing quotes, snapshot skipped:", failed);
      return NextResponse.json(
        { error: "Missing quotes, snapshot skipped", tickers: failed },
        { status: 502 },
      );
    }

    const totalValue = positionValues.reduce(
      (sum, r) => sum + (r.status === "fulfilled" ? r.value : 0),
      0,
    );

    // 5. Upsert into portfolio_history via supabaseAdmin
    //    The cron runs at 18:00 UTC (after Euronext close), so the UTC date is the trading day.
    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabaseAdmin.from("portfolio_history").upsert(
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
