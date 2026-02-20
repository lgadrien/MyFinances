export interface Transaction {
  id: string;
  ticker: string;
  type: "Achat" | "Dividende" | "Vente";
  date: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  fees: number;
  created_at: string;
}

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  currency: string;
  created_at: string;
}

export interface PortfolioPosition {
  ticker: string;
  name: string;
  sector: string | null;
  totalQuantity: number;
  totalInvested: number;
  totalFees: number;
  pru: number;
  dividends: number;
  currentPrice?: number;
  plusValue?: number;
  capitalValue?: number;
}

/** Calcule le PRU (Prix de Revient Unitaire) pour un ticker donné.
 *  PRU = Σ(qté × prix_unitaire) / Σ qté (achats seulement, hors frais).
 */
export function calculatePRU(transactions: Transaction[]): number {
  let totalQty = 0;
  let totalCost = 0;
  for (const t of transactions) {
    if (t.type === "Achat") {
      totalQty += t.quantity;
      totalCost += t.quantity * t.unit_price;
    }
  }
  return totalQty > 0 ? totalCost / totalQty : 0;
}

/** Calcule le total investi basé sur le PRU et la quantité nette (achats - ventes). */
export function calculateTotalInvested(transactions: Transaction[]): number {
  let boughtQty = 0;
  let totalCost = 0;
  let soldQty = 0;

  for (const t of transactions) {
    if (t.type === "Achat") {
      boughtQty += t.quantity;
      totalCost += t.quantity * t.unit_price;
    } else if (t.type === "Vente") {
      soldQty += t.quantity;
    }
  }

  const pru = boughtQty > 0 ? totalCost / boughtQty : 0;
  const netQty = boughtQty - soldQty;
  return netQty > 0 ? pru * netQty : 0;
}

/** Calcule les dividendes cumulés nets : Σ (total_amount - fees) pour type = Dividende. */
export function calculateDividends(transactions: Transaction[]): number {
  let total = 0;
  for (const t of transactions) {
    if (t.type === "Dividende") {
      total += t.total_amount - t.fees;
    }
  }
  return total;
}

/** Calcule la plus-value : (prix_actuel - PRU) × quantité. */
export function calculatePlusValue(
  pru: number,
  currentPrice: number,
  quantity: number,
): number {
  return (currentPrice - pru) * quantity;
}

/**
 * Calcule les positions du portefeuille avec PRU, dividendes, etc.
 * Algorithme O(n) via Map groupée par ticker (vs O(n²) avec filter).
 */
export function calculatePortfolioPositions(
  transactions: Transaction[],
  instrumentLookup?: Map<string, { name: string; sector: string }>,
): PortfolioPosition[] {
  // Accumulate per ticker in a single pass
  type Accumulator = {
    boughtQty: number;
    soldQty: number;
    totalCost: number;
    totalFees: number;
    dividends: number;
  };

  const map = new Map<string, Accumulator>();

  for (const t of transactions) {
    if (!map.has(t.ticker)) {
      map.set(t.ticker, {
        boughtQty: 0,
        soldQty: 0,
        totalCost: 0,
        totalFees: 0,
        dividends: 0,
      });
    }
    const acc = map.get(t.ticker)!;

    if (t.type === "Achat") {
      acc.boughtQty += t.quantity;
      acc.totalCost += t.quantity * t.unit_price;
      acc.totalFees += t.fees;
    } else if (t.type === "Vente") {
      acc.soldQty += t.quantity;
      acc.totalFees += t.fees;
    } else if (t.type === "Dividende") {
      acc.dividends += t.total_amount - t.fees;
      acc.totalFees += t.fees;
    }
  }

  const positions: PortfolioPosition[] = [];

  for (const [ticker, acc] of map) {
    const totalQuantity = acc.boughtQty - acc.soldQty;
    // Skip fully sold positions with no remaining shares
    if (totalQuantity <= 0 && acc.boughtQty === 0) continue;

    const pru = acc.boughtQty > 0 ? acc.totalCost / acc.boughtQty : 0;
    const totalInvested = totalQuantity > 0 ? pru * totalQuantity : 0;

    const info = instrumentLookup?.get(ticker);

    positions.push({
      ticker,
      name: info?.name ?? ticker,
      sector: info?.sector ?? null,
      totalQuantity,
      totalInvested,
      totalFees: acc.totalFees,
      pru,
      dividends: acc.dividends,
    });
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
    if (t.type === "Dividende") {
      const month = t.date.substring(0, 7); // "YYYY-MM"
      grouped.set(month, (grouped.get(month) ?? 0) + t.total_amount);
    }
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));
}
