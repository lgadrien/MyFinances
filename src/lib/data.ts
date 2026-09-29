import type { Transaction } from "@/lib/types";

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

/** Fetch generic app settings (cash & target capital) via API. */
export async function fetchSettings(): Promise<{
  cash_balance: number;
  target_capital: number;
} | null> {
  try {
    const res = await fetch("/api/settings");
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return null;
  }
}

/**
 * Update app settings via API.
 */
export async function updateSettings(
  cash_balance: number,
  target_capital: number,
): Promise<boolean> {
  try {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cash_balance, target_capital }),
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to update settings:", error);
    return false;
  }
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

/** Fetch all transactions via API, sorted by date desc. */
export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const res = await fetch("/api/transactions");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapTransaction) : [];
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return [];
  }
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

/** Insert a new transaction via API. */
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

  try {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data ? mapTransaction(data) : null;
  } catch (error) {
    console.error("Failed to insert transaction:", error);
    return null;
  }
}

/** Update an existing transaction via API. */
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

  try {
    const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data ? mapTransaction(data) : null;
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return null;
  }
}

/** Delete a transaction by ID via API. */
export async function deleteTransaction(id: string): Promise<boolean> {
  if (!id) return false;

  try {
    const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return false;
  }
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

/**
 * Fetch live prices for multiple tickers in a single HTTP request.
 * Uses /api/stock/batch instead of N individual /api/stock calls.
 * Returns a map of ticker → price data; missing tickers are simply absent.
 */
export async function fetchBatchStockPrices(
  tickers: string[],
): Promise<Record<string, { price: number; change: number; changePercent: number }>> {
  if (!tickers.length) return {};
  try {
    const params = tickers.map(encodeURIComponent).join(",");
    const res = await fetch(`/api/stock/batch?tickers=${params}`, {
      signal: AbortSignal.timeout(10_000), // 10 s — batch peut être plus lent
    });
    if (!res.ok) return {};
    const data = await res.json();
    return (data.quotes as Record<string, { price: number; change: number; changePercent: number }>) ?? {};
  } catch {
    return {};
  }
}
