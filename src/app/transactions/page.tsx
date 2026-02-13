"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  ArrowLeftRight,
  Calendar,
  Filter,
  Trash2,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  fetchTransactions,
  insertTransaction,
  deleteTransaction,
} from "@/lib/data";
import type { Transaction } from "@/lib/calculations";

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchDisp: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sorting state
  const [sortKey, setSortKey] = useState<keyof Transaction | null>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Form state
  // ... (keep existing formData)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "Achat" as "Achat" | "Dividende",
    ticker: "",
    quantity: "",
    unitPrice: "",
    totalAmount: "",
    fees: "",
  });

  // Search State
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

  const loadData = useCallback(async () => {
    setLoading(true);
    const txData = await fetchTransactions();
    setTransactions(txData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSort = (key: keyof Transaction) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filteredTransactions = transactions.filter(
    (t) => filterType === "all" || t.type === filterType,
  );

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortKey) return 0;
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue === bValue) return 0;

    // Handle string (date, ticker, type) vs number
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDir === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Handle numbers
    return sortDir === "asc"
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => {
        const next = { ...prev, [name]: value };

        // Auto-calculate total_amount for Achat
        if (
          next.type === "Achat" &&
          (name === "quantity" || name === "unitPrice")
        ) {
          const qty = parseFloat(next.quantity) || 0;
          const price = parseFloat(next.unitPrice) || 0;
          next.totalAmount = (qty * price).toFixed(2);
        }

        return next;
      });
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const result = await insertTransaction({
      ticker: formData.ticker,
      type: formData.type,
      date: formData.date,
      quantity: parseFloat(formData.quantity) || 0,
      unit_price: parseFloat(formData.unitPrice) || 0,
      total_amount: parseFloat(formData.totalAmount) || 0,
      fees: parseFloat(formData.fees) || 0,
    });

    if (result) {
      // Refresh data from Supabase
      await loadData();

      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        type: "Achat",
        ticker: "",
        quantity: "",
        unitPrice: "",
        totalAmount: "",
        fees: "",
      });
      setIsModalOpen(false);
    }

    setSubmitting(false);
  };

  const handleDelete = async (tx: Transaction) => {
    const label = `${tx.type} ${tx.ticker} du ${new Date(tx.date).toLocaleDateString("fr-FR")}`;
    if (!window.confirm(`Supprimer l'opération "${label}" ?`)) return;

    setDeletingId(tx.id);
    const ok = await deleteTransaction(tx.id);
    if (ok) {
      await loadData();
    }
    setDeletingId(null);
  };

  const formatEUR = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(n);

  const inputClasses =
    "w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-500";

  const SortIcon = ({ colKey }: { colKey: keyof Transaction }) => {
    if (sortKey !== colKey)
      return <ChevronsUpDown className="ml-1 h-3 w-3 text-slate-600" />;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3 text-emerald-500" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 text-emerald-500" />
    );
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Historique de vos opérations
          </p>
        </div>

        {/* Desktop button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-violet-500/30 md:flex"
        >
          <Plus className="h-4 w-4" />
          Ajouter une opération
        </button>

        {/* Mobile floating button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 transition-all hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-violet-500/40 active:scale-95 md:hidden"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-zinc-500" />
        {["all", "Achat", "Dividende"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filterType === type
                ? "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            {type === "all" ? "Toutes" : type}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-500">
          {filteredTransactions.length} opération(s)
        </span>
      </div>

      {/* Transactions List */}

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-zinc-900"
              />
            ))
          : sortedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm backdrop-blur-sm"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={tx.type === "Achat" ? "info" : "success"}>
                      {tx.type === "Achat" ? "ACHAT" : "DIV"}
                    </Badge>
                    <span className="text-xs text-zinc-500">
                      {new Date(tx.date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(tx)}
                    className="p-1 text-zinc-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{tx.ticker}</p>
                    {tx.quantity > 0 && (
                      <p className="text-xs text-zinc-400">
                        {tx.quantity} x{" "}
                        {tx.unit_price > 0 ? tx.unit_price.toFixed(2) : "—"} €
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">
                      {formatEUR(tx.total_amount)}
                    </p>
                    {tx.fees > 0 && (
                      <p className="text-xs text-zinc-500">
                        Frais: {formatEUR(tx.fees)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black backdrop-blur-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th
                  className="cursor-pointer px-6 py-4 text-left font-semibold text-zinc-400 hover:text-white"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" /> Date{" "}
                    <SortIcon colKey="date" />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-6 py-4 text-center font-semibold text-zinc-400 hover:text-white"
                  onClick={() => handleSort("type")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Type <SortIcon colKey="type" />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-6 py-4 text-left font-semibold text-zinc-400 hover:text-white"
                  onClick={() => handleSort("ticker")}
                >
                  <div className="flex items-center gap-1">
                    Ticker <SortIcon colKey="ticker" />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-6 py-4 text-right font-semibold text-zinc-400 hover:text-white"
                  onClick={() => handleSort("quantity")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Quantité <SortIcon colKey="quantity" />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-6 py-4 text-right font-semibold text-zinc-400 hover:text-white"
                  onClick={() => handleSort("unit_price")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Prix Unit. <SortIcon colKey="unit_price" />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-6 py-4 text-right font-semibold text-zinc-400 hover:text-white"
                  onClick={() => handleSort("total_amount")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Montant <SortIcon colKey="total_amount" />
                  </div>
                </th>
                <th className="px-6 py-4 text-right font-semibold text-zinc-400">
                  Frais
                </th>
                <th className="w-12 px-3 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-6 py-5">
                        <div className="h-4 animate-pulse rounded bg-zinc-800" />
                      </td>
                    </tr>
                  ))
                : sortedTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="group transition-colors hover:bg-zinc-900/50"
                    >
                      <td className="px-6 py-4 font-medium text-zinc-200">
                        {new Date(tx.date).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          variant={tx.type === "Achat" ? "info" : "success"}
                        >
                          <ArrowLeftRight className="h-3 w-3" />
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white">
                          {tx.ticker}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-zinc-200">
                        {tx.quantity > 0 ? tx.quantity : "—"}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-zinc-200">
                        {tx.unit_price > 0
                          ? `${tx.unit_price.toFixed(2)} €`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-white">
                        {formatEUR(tx.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-400">
                        {tx.fees > 0 ? formatEUR(tx.fees) : "—"}
                      </td>
                      <td className="px-3 py-4 text-center">
                        <button
                          onClick={() => handleDelete(tx)}
                          disabled={deletingId === tx.id}
                          className="rounded-lg p-1.5 text-zinc-500 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100 disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2
                            className={`h-4 w-4 ${deletingId === tx.id ? "animate-pulse" : ""}`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajouter une opération"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={inputClasses}
                required
              >
                <option value="Achat">Achat</option>
                <option value="Dividende">Dividende</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Rechercher un actif
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.ticker}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setFormData((prev) => ({ ...prev, ticker: val }));
                  // Trigger search if length > 1
                  if (val.length > 1) {
                    setTickerSearch(val);
                  } else {
                    setSearchResults([]);
                  }
                }}
                placeholder="Ex: LVMH, Apple, AIR..."
                className={inputClasses}
                autoComplete="off"
                required
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-emerald-500" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 py-1 shadow-xl">
                {searchResults.map((result) => (
                  <li
                    key={result.symbol}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        ticker: result.symbol,
                      }));
                      setSearchResults([]);
                      setTickerSearch(""); // Stop searching
                    }}
                    className="cursor-pointer px-4 py-2 hover:bg-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        {result.symbol}
                      </span>
                      <span className="text-xs text-slate-400">
                        {result.type}
                      </span>
                    </div>
                    <div className="truncate text-xs text-slate-300">
                      {result.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {result.exchDisp}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-1 text-[10px] text-slate-500">
              Tapez le nom ou le ticker (Yahoo Finance)
            </p>
          </div>

          {formData.type === "Achat" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Quantité
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                  step="0.0001"
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Prix unitaire (€)
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className={inputClasses}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Montant total (€)
            </label>
            <input
              type="number"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              className={inputClasses}
              required
              readOnly={formData.type === "Achat"}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Frais (€)
            </label>
            <input
              type="number"
              name="fees"
              value={formData.fees}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              className={inputClasses}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
            >
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
