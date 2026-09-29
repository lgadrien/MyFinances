import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { calculatePortfolioPositions } from "@/lib/calculations";
import { FRENCH_INSTRUMENTS } from "@/lib/french-instruments";
import { getStockQuote } from "@/lib/stocks";
import type { Transaction } from "@/lib/types";

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

    const transactions: Transaction[] = (txData ?? []).map((t) => ({
      ...(t as Transaction),
      quantity: Number(t.quantity),
      unit_price: Number(t.unit_price),
      total_amount: Number(t.total_amount),
      fees: Number(t.fees),
    }));

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
    const activePositions = positions.filter((p) => p.totalQuantity > 0.0001);

    // 4. Get live prices — accumulation thread-safe via reduce sur les résultats
    const totalInvested = activePositions.reduce((sum, p) => sum + p.totalInvested, 0);

    const positionValues = await Promise.allSettled(
      activePositions.map(async (pos) => {
        const quote = await getStockQuote(pos.ticker);
        return (quote.price ?? 0) * pos.totalQuantity;
      }),
    );

    const totalValue = positionValues.reduce(
      (sum, r) => sum + (r.status === "fulfilled" ? r.value : 0),
      0,
    );

    // 5. Upsert into portfolio_history via supabaseAdmin
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
