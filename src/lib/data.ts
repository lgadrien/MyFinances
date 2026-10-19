import type { Transaction, TransactionPayload } from "@/lib/types";
import { mapTransactionRow } from "@/lib/validation";

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
// These throw so React Query retries and keeps the last good data, and the UI shows the server's message.

/** fetch() that throws the server's error text, or "Erreur réseau" when the request never got an answer. */
async function request(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init).catch(() => {
    throw new Error("Erreur réseau");
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "Erreur serveur");
  }
  return res;
}

/** Fetch all transactions via API, sorted by date desc. */
export async function fetchTransactions(): Promise<Transaction[]> {
  const data = await (await request("/api/transactions")).json();
  return Array.isArray(data) ? data.map(mapTransactionRow) : [];
}

/** Insert a new transaction via API (validated server-side). */
export async function insertTransaction(
  tx: TransactionPayload,
): Promise<Transaction> {
  const res = await request("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tx),
  });
  return mapTransactionRow(await res.json());
}

/** Insert several transactions in one request (all or nothing). */
export async function insertTransactions(
  txs: TransactionPayload[],
): Promise<void> {
  await request("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(txs),
  });
}

/** Update an existing transaction via API (validated server-side). */
export async function updateTransaction(
  id: string,
  tx: TransactionPayload,
): Promise<Transaction> {
  if (!id) throw new Error("ID manquant");
  const res = await request(`/api/transactions/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tx),
  });
  return mapTransactionRow(await res.json());
}

/** Delete a transaction by ID via API. */
export async function deleteTransaction(id: string): Promise<void> {
  if (!id) throw new Error("ID manquant");
  await request(`/api/transactions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
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
