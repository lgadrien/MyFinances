/**
 * src/lib/calculations.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Financial calculations engine for PEA / Crypto portfolio tracking.
 * Provides accurate PRU (Weighted Average Price), P&L, dividend projections,
 * and positions calculation.
 */

export type {
  Transaction,
  PortfolioPosition,
  EnrichedPortfolioPosition,
  TransactionType,
} from "@/lib/types";

import type {
  Transaction,
  PortfolioPosition,
  EnrichedPortfolioPosition,
} from "@/lib/types";

/** Calcule les dividendes cumulés nets : Σ (total_amount - fees) pour type = Dividende */
export function calculateDividends(transactions: Transaction[]): number {
  let total = 0;
  for (const t of transactions) {
    if (t.type === "Dividende") {
      total += (Number(t.total_amount) || 0) - (Number(t.fees) || 0);
    }
  }
  return total;
}

/** Base taxable du PEA = valeur des titres − achats et frais + ventes et dividendes nets (le cash s'annule). */
export function calculatePlanGain(
  transactions: Transaction[],
  currentValue: number,
): number {
  let gain = currentValue;
  for (const t of transactions) {
    const amount = Number(t.total_amount) || 0;
    const fees = Number(t.fees) || 0;
    if (t.type === "Achat") {
      gain -= ((Number(t.quantity) || 0) * (Number(t.unit_price) || 0) || amount) + fees;
    } else {
      gain += amount - fees;
    }
  }
  return gain;
}

/** Taux d'imposition du gain d'un PEA au retrait (dates "YYYY-MM-DD"). */
export function peaTaxRate(firstDate: string, today: string): number {
  // LFSS 2026 : prélèvements sociaux 18,6 % (au lieu de 17,2 %) ; avant 5 ans le retrait clôture le plan et ajoute 12,8 % d'IR
  // shortcut: gains made before 2026 may keep their historical social-charge rates; the first transaction date stands in for the PEA opening date (may be later than the real one) — add a setting if that matters
  const fifthAnniversary = `${Number(firstDate.slice(0, 4)) + 5}${firstDate.slice(4, 10)}`;
  return today < fifthAnniversary ? 0.314 : 0.186;
}

/** Valorise les positions au cours live, ou au PRU quand le cours manque. */
export function enrichPositions(
  positions: PortfolioPosition[],
  quotes: Record<string, { price: number }>,
): EnrichedPortfolioPosition[] {
  return positions.map((p) => {
    const currentPrice = quotes[p.ticker]?.price ?? p.pru;
    const capitalValue = currentPrice * p.totalQuantity;
    return { ...p, currentPrice, capitalValue, plusValue: capitalValue - p.totalInvested };
  });
}

/**
 * Calcule les positions du portefeuille avec PRU chronologique et dividendes.
 */
export function calculatePortfolioPositions(
  transactions: Transaction[],
  instrumentLookup?: Map<string, { name: string; sector: string }>,
): PortfolioPosition[] {
  // Regrouper par ticker
  const txByTicker = new Map<string, Transaction[]>();

  for (const t of transactions) {
    if (!t.ticker) continue;
    const ticker = t.ticker.trim().toUpperCase();
    if (!txByTicker.has(ticker)) {
      txByTicker.set(ticker, []);
    }
    txByTicker.get(ticker)!.push(t);
  }

  const positions: PortfolioPosition[] = [];

  for (const [ticker, txList] of txByTicker) {
    // Trier chronologiquement ; même jour → ordre de saisie (sinon une vente peut passer avant son achat)
    const sorted = [...txList].sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.created_at ?? "").localeCompare(b.created_at ?? ""),
    );

    let currentQty = 0;
    let currentPRU = 0;
    let dividends = 0;

    for (const t of sorted) {
      const qty = Number(t.quantity) || 0;
      const price = Number(t.unit_price) || 0;
      const fees = Number(t.fees) || 0;
      const totalAmount = Number(t.total_amount) || 0;

      if (t.type === "Achat" && qty > 0) {
        const newQty = currentQty + qty;
        // L'import CSV laisse unit_price à 0 et ne renseigne que total_amount
        const totalCost = currentQty * currentPRU + (qty * price || totalAmount) + fees;
        currentPRU = newQty > 0 ? totalCost / newQty : 0;
        currentQty = newQty;
      } else if (t.type === "Vente" && qty > 0) {
        currentQty = Math.max(0, currentQty - qty);
        if (currentQty === 0) {
          currentPRU = 0;
        }
      } else if (t.type === "Dividende") {
        dividends += totalAmount - fees;
      }
    }

    // Position soldée : exclue ici, ses dividendes restent comptés par calculateDividends
    if (currentQty > 0.0001) {
      const info = instrumentLookup?.get(ticker);

      positions.push({
        ticker,
        name: info?.name ?? ticker,
        sector: info?.sector ?? null,
        totalQuantity: currentQty,
        totalInvested: currentPRU * currentQty,
        pru: currentPRU,
        dividends,
      });
    }
  }

  return positions;
}

/**
 * Groupe les dividendes par mois pour le graphique en barres.
 * Retourne les données triées chronologiquement.
 */
export function groupDividendsByMonth(
  transactions: Transaction[],
): { month: string; amount: number }[] {
  const grouped = new Map<string, number>();

  for (const t of transactions) {
    if (t.type === "Dividende" && t.date) {
      const month = t.date.substring(0, 7); // "YYYY-MM"
      const net = (Number(t.total_amount) || 0) - (Number(t.fees) || 0);
      grouped.set(month, (grouped.get(month) ?? 0) + net);
    }
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));
}
