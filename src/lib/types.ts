/**
 * src/lib/types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central type definitions for the MyFinances application.
 */

// ─── Transactions & Portefeuille ──────────────────────────────────────────────

export type TransactionType = "Achat" | "Vente" | "Dividende";

export interface Transaction {
  id: string;
  ticker: string;
  type: TransactionType;
  date: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  fees: number;
  created_at: string;
}

export type TransactionPayload = Omit<Transaction, "id" | "created_at">;

export interface PortfolioPosition {
  ticker: string;
  name: string;
  sector: string | null;
  totalQuantity: number;
  totalInvested: number;
  pru: number;
  dividends: number;
}

export interface EnrichedPortfolioPosition extends PortfolioPosition {
  currentPrice: number;
  plusValue: number;
  capitalValue: number;
}

// ─── Market ───────────────────────────────────────────────────────────────────

export type MarketCategory = "Action" | "Indice";

export interface MarketInstrument {
  ticker: string;
  name: string;
  sector: string;
  category: MarketCategory;
}

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export interface MarketRow {
  ticker: string;
  name: string;
  sector: string;
  category: MarketCategory;
  price: number;
  change: number;
  changePercent: number;
  owned: boolean;
  loaded: boolean;
}
