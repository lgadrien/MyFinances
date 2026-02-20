import { supabase } from "./supabase";
import type { Transaction } from "./calculations";

const FAVORITES_KEY = "myfinances_favorites";

/**
 * Fetch favorites from Supabase via API
 */
export async function fetchFavorites(): Promise<string[]> {
  try {
    const res = await fetch("/api/favorites");
    if (!res.ok) return [];
    const data = await res.json();
    return data.favorites || [];
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
    return [];
  }
}

/**
 * Add a favorite via API
 */
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

/**
 * Remove a favorite via API
 */
export async function removeFavorite(ticker: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/favorites?ticker=${encodeURIComponent(ticker)}`,
      {
        method: "DELETE",
      },
    );
    return res.ok;
  } catch (error) {
    console.error("Failed to remove favorite:", error);
    return false;
  }
}

/**
 * Fetch all transactions from Supabase, sorted by date desc
 */
export async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }

  return (data || []).map((t) => ({
    ...t,
    quantity: Number(t.quantity),
    unit_price: Number(t.unit_price),
    total_amount: Number(t.total_amount),
    fees: Number(t.fees),
  }));
}

/**
 * Insert a new transaction into Supabase
 */
export async function insertTransaction(tx: {
  ticker: string;
  type: "Achat" | "Dividende" | "Vente";
  date: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  fees: number;
}): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from("transactions")
    .insert(tx)
    .select()
    .single();

  if (error) {
    console.error("Error inserting transaction:", error);
    return null;
  }

  return data
    ? {
        ...data,
        quantity: Number(data.quantity),
        unit_price: Number(data.unit_price),
        total_amount: Number(data.total_amount),
        fees: Number(data.fees),
      }
    : null;
}

/**
 * Update an existing transaction in Supabase
 */
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
  const { data, error } = await supabase
    .from("transactions")
    .update(tx)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating transaction:", error);
    return null;
  }

  return data
    ? {
        ...data,
        quantity: Number(data.quantity),
        unit_price: Number(data.unit_price),
        total_amount: Number(data.total_amount),
        fees: Number(data.fees),
      }
    : null;
}

/**
 * Delete a transaction from Supabase by ID
 */
export async function deleteTransaction(id: string): Promise<boolean> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) {
    console.error("Error deleting transaction:", error);
    return false;
  }

  return true;
}

/**
 * Fetch live stock price from our API route
 */
export async function fetchStockPrice(
  ticker: string,
): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const res = await fetch(`/api/stock?ticker=${encodeURIComponent(ticker)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
    };
  } catch {
    return null;
  }
}
