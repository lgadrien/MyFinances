/**
 * src/lib/calculations.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Financial calculations engine for PEA / Crypto portfolio tracking.
 * Provides accurate PRU (Weighted Average Price), P&L, dividend projections,
 * and positions calculation.
 */

export type {
  Transaction,
  Asset,
  PortfolioPosition,
  EnrichedPortfolioPosition,
  TransactionType,
} from "@/lib/types";

import type { Transaction, PortfolioPosition } from "@/lib/types";

/**
 * Calcule le PRU chronologique pour un ensemble de transactions d'un ticker.
 * Gère correctement la réinitialisation du PRU si la position a été clôturée (quantité = 0).
 */
export function calculatePRU(transactions: Transaction[]): number {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  let currentQty = 0;
  let currentPRU = 0;

  for (const t of sorted) {
    const qty = Number(t.quantity) || 0;
    const price = Number(t.unit_price) || 0;
    const fees = Number(t.fees) || 0;

    if (t.type === "Achat" && qty > 0) {
      const newQty = currentQty + qty;
      const totalCost = currentQty * currentPRU + qty * price + fees;
      currentPRU = newQty > 0 ? totalCost / newQty : 0;
      currentQty = newQty;
    } else if (t.type === "Vente" && qty > 0) {
      currentQty = Math.max(0, currentQty - qty);
      if (currentQty === 0) {
        currentPRU = 0;
      }
    }
  }

  return currentPRU;
}

/** Calcule le montant total investi net actuel du portefeuille */
export function calculateTotalInvested(transactions: Transaction[]): number {
  const positions = calculatePortfolioPositions(transactions);
  return positions.reduce((sum, p) => sum + (p.totalInvested || 0), 0);
}

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

/** Calcule la plus-value latente : (prix_actuel - PRU) × quantité */
export function calculatePlusValue(
  pru: number,
  currentPrice: number,
  quantity: number,
): number {
  return (currentPrice - pru) * quantity;
}

/**
 * Calcule les positions du portefeuille avec PRU chronologique, dividendes et frais.
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
    // Trier chronologiquement
    const sorted = [...txList].sort((a, b) => a.date.localeCompare(b.date));

    let currentQty = 0;
    let currentPRU = 0;
    let totalFees = 0;
    let dividends = 0;

    for (const t of sorted) {
      const qty = Number(t.quantity) || 0;
      const price = Number(t.unit_price) || 0;
      const fees = Number(t.fees) || 0;
      const totalAmount = Number(t.total_amount) || 0;

      totalFees += fees;

      if (t.type === "Achat" && qty > 0) {
        const newQty = currentQty + qty;
        const totalCost = currentQty * currentPRU + qty * price + fees;
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

    // Si on a des actions restantes ou des dividendes historiques
    if (currentQty > 0.0001 || dividends > 0) {
      const info = instrumentLookup?.get(ticker);
      const totalInvested = currentQty > 0 ? currentPRU * currentQty : 0;

      positions.push({
        ticker,
        name: info?.name ?? ticker,
        sector: info?.sector ?? null,
        totalQuantity: currentQty,
        totalInvested,
        totalFees,
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
