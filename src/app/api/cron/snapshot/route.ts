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
    const today = new Date().toISOString().split("T")[0];
    const results: any = { date: today, PEA: null, BINANCE: null };

    // ==========================================
    // 1. PEA SNAPSHOT (Existing logic)
    // ==========================================
    try {
      const transactions = await fetchTransactions(); // You might need to update fetchTransactions to filter by environment='PEA' later
      if (transactions.length > 0) {
        const instrumentMap = new Map<string, { name: string; sector: string }>();
        FRENCH_INSTRUMENTS.forEach((i) => {
          instrumentMap.set(i.ticker, { name: i.name, sector: i.sector });
        });

        const positions = calculatePortfolioPositions(transactions, instrumentMap);
        const activePositions = positions.filter((p) => p.totalQuantity > 0.0001);

        let totalValue = 0;
        const totalInvested = activePositions.reduce((sum, p) => sum + p.totalInvested, 0);

        await Promise.allSettled(
          activePositions.map(async (pos) => {
            const quote = await getStockQuote(pos.ticker);
            const currentPrice = quote.price ?? 0;
            totalValue += currentPrice * pos.totalQuantity;
          }),
        );

        const { error } = await supabase.from("portfolio_history").upsert(
          {
            date: today,
            environment: "PEA",
            total_value: totalValue,
            total_invested: totalInvested,
          },
          { onConflict: "date,environment" },
        );

        if (!error) {
          results.PEA = { success: true, totalValue, totalInvested };
        } else {
          results.PEA = { success: false, error: error.message };
        }
      } else {
        results.PEA = { message: "No transactions found" };
      }
    } catch (e: any) {
      results.PEA = { success: false, error: e.message };
    }

    // ==========================================
    // 2. BINANCE SNAPSHOT (New logic)
    // ==========================================
    try {
      // TODO: Implémenter l'appel à l'API Binance avec ccxt ou fetch REST
      // Exemple avec ccxt (il faudra installer 'ccxt'):
      // const ccxt = require('ccxt');
      // const exchange = new ccxt.binance({
      //   apiKey: process.env.BINANCE_API_KEY,
      //   secret: process.env.BINANCE_API_SECRET,
      // });
      // const balance = await exchange.fetchBalance();
      // const totalValueInUSDT = ... // Calculer la valeur totale en USDT ou EUR

      // Valeurs fictives pour le premier jet
      const mockBinanceTotalValue = 12500.50; 
      const mockBinanceTotalInvested = 10000.00; // Si traçable

      const { error } = await supabase.from("portfolio_history").upsert(
        {
          date: today,
          environment: "BINANCE",
          total_value: mockBinanceTotalValue,
          total_invested: mockBinanceTotalInvested,
        },
        { onConflict: "date,environment" }, // Nécessite la mise à jour de la contrainte unique dans la BDD
      );

      if (!error) {
        results.BINANCE = { success: true, totalValue: mockBinanceTotalValue, totalInvested: mockBinanceTotalInvested };
      } else {
        results.BINANCE = { success: false, error: error.message };
      }
    } catch (e: any) {
      results.BINANCE = { success: false, error: e.message };
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Snapshot error:", error);
    return NextResponse.json(
      { error: "Failed to create snapshots" },
      { status: 500 },
    );
  }
}
