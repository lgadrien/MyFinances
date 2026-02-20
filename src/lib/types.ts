/** src/lib/types.ts
 *  Central type definitions for the MyFinances application.
 *  Import all shared types from here rather than scattering them across pages.
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

export interface PortfolioSnapshot {
  date: string;
  total_value: number;
  total_invested: number;
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

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppSettings {
  cash_balance: number;
  target_capital: number;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  retryAfter?: number;
  remaining?: number;
}

export interface PriceData {
  price: number;
  change: number;
  changePercent: number;
}
