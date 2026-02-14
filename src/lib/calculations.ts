export interface Transaction {
  id: string;
  ticker: string;
  type: "Achat" | "Dividende";
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

/**
 * Calcule le PRU (Prix de Revient Unitaire) pour un ticker donné.
 * PRU = Σ(quantité × prix_unitaire) / Σ quantité
 * Note: Les frais ne sont PAS inclus dans le PRU pour le calcul de la plus-value
 */
export function calculatePRU(transactions: Transaction[]): number {
  const buys = transactions.filter((t) => t.type === "Achat");
  const totalQty = buys.reduce((sum, t) => sum + t.quantity, 0);
  if (totalQty === 0) return 0;
  const totalCost = buys.reduce((sum, t) => sum + t.quantity * t.unit_price, 0);
  return totalCost / totalQty;
}

/**
 * Calcule le total investi : Σ(quantité × prix_unitaire) (achats uniquement)
 * Note: Les frais ne sont PAS inclus dans le total investi pour le calcul de la plus-value
 */
export function calculateTotalInvested(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "Achat")
    .reduce((sum, t) => sum + t.quantity * t.unit_price, 0);
}

/**
 * Calcule les dividendes cumulés nets : Σ (total_amount - fees) (type = Dividende)
 * Les frais sont soustraits car ils réduisent le montant réellement reçu
 */
export function calculateDividends(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "Dividende")
    .reduce((sum, t) => sum + t.total_amount - t.fees, 0);
}

/**
 * Calcule la plus-value : (prix_actuel - PRU) × quantité
 */
export function calculatePlusValue(
  pru: number,
  currentPrice: number,
  quantity: number,
): number {
  return (currentPrice - pru) * quantity;
}

/**
 * Calcule les positions du portefeuille avec PRU, dividendes, etc.
 * Dérive les actifs directement à partir des transactions et de FRENCH_INSTRUMENTS.
 */
export function calculatePortfolioPositions(
  transactions: Transaction[],
  instrumentLookup?: Map<string, { name: string; sector: string }>,
): PortfolioPosition[] {
  const positions: PortfolioPosition[] = [];

  // Get unique tickers from transactions
  const tickers = [...new Set(transactions.map((t) => t.ticker))];

  for (const ticker of tickers) {
    const assetTxs = transactions.filter((t) => t.ticker === ticker);
    const buys = assetTxs.filter((t) => t.type === "Achat");

    const totalQuantity = buys.reduce((sum, t) => sum + t.quantity, 0);
    if (totalQuantity === 0 && assetTxs.length === 0) continue;

    const totalInvested = buys.reduce(
      (sum, t) => sum + t.quantity * t.unit_price,
      0,
    );
    const totalFees = buys.reduce((sum, t) => sum + t.fees, 0);
    const pru = totalQuantity > 0 ? totalInvested / totalQuantity : 0;
    const dividends = calculateDividends(assetTxs);

    const info = instrumentLookup?.get(ticker);

    positions.push({
      ticker,
      name: info?.name || ticker,
      sector: info?.sector || null,
      totalQuantity,
      totalInvested,
      totalFees,
      pru,
      dividends,
    });
  }

  return positions;
}

/**
 * Groupe les dividendes par mois pour le graphique en barres
 */
export function groupDividendsByMonth(
  transactions: Transaction[],
): { month: string; amount: number }[] {
  const divs = transactions.filter((t) => t.type === "Dividende");
  const grouped: Record<string, number> = {};

  for (const d of divs) {
    const month = d.date.substring(0, 7); // "YYYY-MM"
    grouped[month] = (grouped[month] || 0) + d.total_amount;
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));
}
