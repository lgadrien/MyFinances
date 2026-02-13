"use client";

import { useState, useEffect } from "react";

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchDisp: string;
}

interface TransactionFormProps {
  formData: {
    date: string;
    type: "Achat" | "Dividende";
    ticker: string;
    quantity: string;
    unitPrice: string;
    totalAmount: string;
    fees: string;
  };
  onSubmit: (e: React.FormEvent) => void;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onTickerChange: (ticker: string) => void;
  submitting: boolean;
  isEditing: boolean;
  onCancel: () => void;
}

export default function TransactionForm({
  formData,
  onSubmit,
  onChange,
  onTickerChange,
  submitting,
  isEditing,
  onCancel,
}: TransactionFormProps) {
  const [tickerSearch, setTickerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (tickerSearch.length > 1) {
        setIsSearching(true);
        try {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(tickerSearch)}`,
          );
          const data = await res.json();
          setSearchResults(data);
        } catch (error) {
          console.error("Search error", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [tickerSearch]);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Date and Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={onChange}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={onChange}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            required
          >
            <option value="Achat">Achat</option>
            <option value="Dividende">Dividende</option>
          </select>
        </div>
      </div>

      {/* Ticker Search */}
      <div className="relative">
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Actif (Ticker)
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.ticker}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              onTickerChange(val);
              if (val.length > 1) {
                setTickerSearch(val);
              } else {
                setSearchResults([]);
              }
            }}
            placeholder="Ex: LVMH, AAPL, AIR.PA..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-zinc-500"
            autoComplete="off"
            required
          />
          {isSearching && (
            <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-violet-500" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <ul className="absolute z-50 mt-2 max-h-48 w-full overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
            {searchResults.map((result) => (
              <li
                key={result.symbol}
                onClick={() => {
                  onTickerChange(result.symbol);
                  setSearchResults([]);
                  setTickerSearch("");
                }}
                className="cursor-pointer px-4 py-2.5 transition-colors hover:bg-zinc-700"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">
                    {result.symbol}
                  </span>
                  <span className="text-xs text-zinc-400">{result.type}</span>
                </div>
                <div className="truncate text-sm text-zinc-300">
                  {result.name}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quantity and Unit Price (for Achat only) */}
      {formData.type === "Achat" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Quantité
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={onChange}
              placeholder="0"
              step="0.0001"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-zinc-500"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Prix unitaire (€)
            </label>
            <input
              type="number"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={onChange}
              placeholder="0.00"
              step="0.01"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-zinc-500"
              required
            />
          </div>
        </div>
      )}

      {/* Total Amount */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Montant total (€)
        </label>
        <input
          type="number"
          name="totalAmount"
          value={formData.totalAmount}
          onChange={onChange}
          placeholder="0.00"
          step="0.01"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-zinc-500"
          required
          readOnly={formData.type === "Achat"}
        />
        {formData.type === "Achat" && (
          <p className="mt-1.5 text-xs text-zinc-500">
            Calculé automatiquement : Quantité × Prix unitaire
          </p>
        )}
      </div>

      {/* Fees (Optional, collapsed) */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200">
          + Frais (optionnel)
        </summary>
        <div className="mt-3">
          <input
            type="number"
            name="fees"
            value={formData.fees}
            onChange={onChange}
            placeholder="0.00"
            step="0.01"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-zinc-500"
          />
        </div>
      </details>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-violet-500/30 disabled:opacity-50"
        >
          {submitting
            ? "Enregistrement..."
            : isEditing
              ? "Modifier"
              : "Ajouter"}
        </button>
      </div>
    </form>
  );
}
