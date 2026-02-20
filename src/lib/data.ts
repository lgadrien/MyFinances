import { supabase } from "./supabase";
import type { Transaction } from "./calculations";

// Shared transaction row mapper — avoids repeating Number() casts everywhere
function mapTransaction(t: unknown): Transaction {
  const row = t as Transaction;
  return {
    ...row,
    quantity: Number(row.quantity),
    unit_price: Number(row.unit_price),
    total_amount: Number(row.total_amount),
    fees: Number(row.fees),
  };
}

// ─── Settings ────────────────────────────────────────────────────────────────

/** Fetch generic app settings (cash & target capital). */
export async function fetchSettings(): Promise<{
  cash_balance: number;
  target_capital: number;
} | null> {
  const { data, error } = await supabase
    .from("settings")
    .select("cash_balance, target_capital")
    .limit(1)
    .single();

  if (error || !data) return null;
  return {
    cash_balance: Number(data.cash_balance),
    target_capital: Number(data.target_capital),
  };
}

/**
 * Upsert app settings — one round-trip instead of two (select + update).
 * Requires the settings table to have a unique constraint usable by upsert.
 */
export async function updateSettings(
  cash_balance: number,
  target_capital: number,
): Promise<boolean> {
  // First fetch the id (we need it to target the right row)
  const { data: row } = await supabase
    .from("settings")
    .select("id")
    .limit(1)
    .single();

  if (!row) return false;

  const { error } = await supabase
    .from("settings")
    .update({
      cash_balance,
      target_capital,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  return !error;
}

// ─── Favorites ───────────────────────────────────────────────────────────────

/** Fetch favorites from Supabase via API. */
export async function fetchFavorites(): Promise<string[]> {
  try {
    const res = await fetch("/api/favorites");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.favorites) ? data.favorites : [];
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
    return [];
  }
}

/** Add a favorite via API. */
export async function addFavorite(ticker: string): Promise<boolean> {
  try {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker }),
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to add favorite:", error);
    return false;
  }
}

/** Remove a favorite via API. */
export async function removeFavorite(ticker: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/favorites?ticker=${encodeURIComponent(ticker)}`,
      { method: "DELETE" },
    );
    return res.ok;
  } catch (error) {
    console.error("Failed to remove favorite:", error);
    return false;
  }
}

// ─── Transactions ─────────────────────────────────────────────────────────────

/** Fetch all transactions from Supabase, sorted by date desc. */
export async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, ticker, type, date, quantity, unit_price, total_amount, fees, created_at",
    )
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error.message);
    return [];
  }

  return (data ?? []).map(mapTransaction);
}

/** Validate transaction payload before sending to DB. */
function validateTransactionPayload(tx: {
  ticker: string;
  type: string;
  date: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  fees: number;
}): string | null {
  if (!tx.ticker?.trim()) return "Ticker manquant";
  if (!["Achat", "Vente", "Dividende"].includes(tx.type))
    return "Type invalide";
  if (!tx.date || isNaN(Date.parse(tx.date))) return "Date invalide";
  if (tx.quantity < 0) return "Quantité négative";
  if (tx.total_amount < 0) return "Montant négatif";
  if (tx.fees < 0) return "Frais négatifs";
  return null;
}

/** Insert a new transaction into Supabase. */
export async function insertTransaction(tx: {
  ticker: string;
  type: "Achat" | "Dividende" | "Vente";
  date: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  fees: number;
}): Promise<Transaction | null> {
  const validationError = validateTransactionPayload(tx);
  if (validationError) {
    console.error("Invalid transaction:", validationError);
    return null;
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...tx, ticker: tx.ticker.trim().toUpperCase() })
    .select()
    .single();

  if (error) {
    console.error("Error inserting transaction:", error.message);
    return null;
  }

  return data ? mapTransaction(data as Record<string, unknown>) : null;
}

/** Update an existing transaction in Supabase. */
export async function updateTransaction(
  id: string,
  tx: {
    ticker: string;
    type: "Achat" | "Dividende" | "Vente";
    date: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    fees: number;
  },
): Promise<Transaction | null> {
  if (!id) return null;

  const validationError = validateTransactionPayload(tx);
  if (validationError) {
    console.error("Invalid transaction:", validationError);
    return null;
  }

  const { data, error } = await supabase
    .from("transactions")
    .update({ ...tx, ticker: tx.ticker.trim().toUpperCase() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating transaction:", error.message);
    return null;
  }

  return data ? mapTransaction(data as Record<string, unknown>) : null;
}

/** Delete a transaction from Supabase by ID. */
export async function deleteTransaction(id: string): Promise<boolean> {
  if (!id) return false;

  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) {
    console.error("Error deleting transaction:", error.message);
    return false;
  }

  return true;
}

// ─── Market data ─────────────────────────────────────────────────────────────

/** Fetch live stock price from our API route. */
export async function fetchStockPrice(
  ticker: string,
): Promise<{ price: number; change: number; changePercent: number } | null> {
  if (!ticker) return null;
  try {
    const res = await fetch(
      `/api/stock?ticker=${encodeURIComponent(ticker)}`,
      { signal: AbortSignal.timeout(8000) }, // 8 s hard timeout
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Guard against malformed responses
    if (typeof data.price !== "number") return null;
    return {
      price: data.price,
      change: data.change ?? 0,
      changePercent: data.changePercent ?? 0,
    };
  } catch {
    return null;
  }
}
