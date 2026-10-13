import type { Transaction, TransactionPayload, TransactionType } from "@/lib/types";

/**
 * src/lib/validation.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Input validation helpers and regular expressions.
 */

/**
 * Standard ticker validation regex.
 * Accepts 1-12 uppercase alphanumeric characters and symbols: ^ . = -
 * Examples: MC.PA, CW8.PA, AAPL, ^FCHI, BTC-EUR
 */
export const TICKER_RE = /^[A-Z0-9^.=-]{1,12}$/;

/**
 * Sanitizes and validates a ticker string.
 * Returns the uppercase trimmed string if valid, or null if invalid.
 */
export function sanitizeTicker(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toUpperCase();
  return TICKER_RE.test(t) ? t : null;
}

const TRANSACTION_TYPES = ["Achat", "Vente", "Dividende"];

/** Validates an untrusted transaction body and returns the payload to store. */
export function parseTransaction(
  raw: unknown,
): { data: TransactionPayload } | { error: string } {
  const body = (raw ?? {}) as Record<string, unknown>;
  const { ticker, type, date } = body;
  if (typeof ticker !== "string" || !ticker.trim()) return { error: "Ticker manquant" };
  if (!TRANSACTION_TYPES.includes(type as string)) return { error: "Type invalide" };
  if (typeof date !== "string" || isNaN(Date.parse(date))) return { error: "Date invalide" };

  const data = {
    ticker: ticker.trim().toUpperCase(),
    type: type as TransactionType,
    date,
    quantity: Number(body.quantity ?? 0),
    unit_price: Number(body.unit_price ?? 0),
    total_amount: Number(body.total_amount),
    fees: Number(body.fees ?? 0),
  };
  // `!(x >= 0)` also rejects NaN, which `x < 0` lets through
  if (!(data.quantity >= 0)) return { error: "Quantité invalide" };
  if (!(data.unit_price >= 0)) return { error: "Prix invalide" };
  if (!(data.total_amount >= 0)) return { error: "Montant invalide" };
  if (!(data.fees >= 0)) return { error: "Frais invalides" };
  return { data };
}

/** Supabase returns NUMERIC columns as strings: cast them back to numbers. */
export function mapTransactionRow(row: unknown): Transaction {
  const t = row as Transaction;
  return {
    ...t,
    quantity: Number(t.quantity),
    unit_price: Number(t.unit_price),
    total_amount: Number(t.total_amount),
    fees: Number(t.fees),
  };
}
