"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  ArrowLeftRight,
  Calendar,
  Filter,
  Trash2,
  Pencil,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Download,
  Upload,
} from "lucide-react";
import { useRef } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  fetchTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
  fetchStockPrice,
} from "@/lib/data";
import type { Transaction } from "@/lib/calculations";
import toast from "react-hot-toast";

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
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  // Sorting state
  const [sortKey, setSortKey] = useState<keyof Transaction | null>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  // ... (keep existing formData)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "Achat" as "Achat" | "Dividende" | "Vente",
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

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Date",
      "Type",
      "Ticker",
      "Quantité",
      "Prix Unitaire",
      "Montant Total",
      "Frais",
    ];
    const rows = sortedTransactions.map((tx) =>
      [
        tx.id,
        tx.date,
        tx.type,
        tx.ticker,
        tx.quantity.toString(),
        tx.unit_price.toString(),
        tx.total_amount.toString(),
        tx.fees.toString(),
      ].join(","),
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `myfinances_transactions_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split("\n");

      // Ignorer la première ligne (headers)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(",");
        if (cols.length < 8) continue;

        // cols[0] = ID original (ignoré pour insérer comme nouvelle entrée)
        const txData = {
          date: cols[1],
          type: cols[2] as "Achat" | "Vente" | "Dividende",
          ticker: cols[3],
          quantity: parseFloat(cols[4]) || 0,
          unit_price: parseFloat(cols[5]) || 0,
          total_amount: parseFloat(cols[6]) || 0,
          fees: parseFloat(cols[7]) || 0,
        };
        await insertTransaction(txData);
      }
      await loadData();
      toast.success("Import CSV réussi !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'import CSV.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => {
        const next = { ...prev, [name]: value };

        // Auto-calculate total_amount for Achat/Vente
        if (
          (next.type === "Achat" || next.type === "Vente") &&
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

    const txData = {
      ticker: formData.ticker,
      type: formData.type,
      date: formData.date,
      quantity: parseFloat(formData.quantity) || 0,
      unit_price: parseFloat(formData.unitPrice) || 0,
      total_amount: parseFloat(formData.totalAmount) || 0,
      fees: parseFloat(formData.fees) || 0,
    };

    const result = editingTransaction
      ? await updateTransaction(editingTransaction.id, txData)
      : await insertTransaction(txData);

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
      setEditingTransaction(null);
      setIsModalOpen(false);
      toast.success(
        editingTransaction ? "Opération modifiée" : "Opération ajoutée",
      );
    } else {
      toast.error("Une erreur est survenue.");
    }

    setSubmitting(false);
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormData({
      date: tx.date,
      type: tx.type,
      ticker: tx.ticker,
      quantity: tx.quantity.toString(),
      unitPrice: tx.unit_price.toString(),
      totalAmount: tx.total_amount.toString(),
      fees: tx.fees.toString(),
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;

    setDeletingId(transactionToDelete.id);
    const ok = await deleteTransaction(transactionToDelete.id);
    if (ok) {
      await loadData();
      toast.success("Opération supprimée");
    } else {
      toast.error("Erreur lors de la suppression");
    }
    setDeletingId(null);
    setTransactionToDelete(null);
  };

  const handleDeleteClick = (tx: Transaction) => {
    setTransactionToDelete(tx);
  };

  const formatEUR = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n) + " €";

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

        {/* Mobile compact button */}
        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-violet-500/30 active:scale-95 md:hidden"
        >
          <Plus className="h-5 w-5" />
        </button>

        {/* Desktop button */}
        <div className="hidden items-center gap-3 md:flex">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportCSV}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
            title="Importer CSV"
          >
            <Upload className="h-4 w-4" />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
            title="Exporter CSV"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-violet-500/30"
          >
            <Plus className="h-4 w-4" />
            Ajouter une opération
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-zinc-500" />
        {["all", "Achat", "Vente", "Dividende"].map((type) => (
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
                    <Badge
                      variant={
                        tx.type === "Achat"
                          ? "info"
                          : tx.type === "Vente"
                            ? "warning"
                            : "success"
                      }
                    >
                      {tx.type === "Achat"
                        ? "ACHAT"
                        : tx.type === "Vente"
                          ? "VENTE"
                          : "DIV"}
                    </Badge>
                    <span className="text-xs text-zinc-500">
                      {new Date(tx.date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(tx)}
                      className="p-1 text-zinc-500 hover:text-violet-400"
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(tx)}
                      className="p-1 text-zinc-500 hover:text-rose-400"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{tx.ticker}</p>
                    {tx.quantity > 0 && (
                      <p className="text-xs text-zinc-400">
                        {tx.quantity} x{" "}
                        {tx.unit_price > 0 ? formatPrice(tx.unit_price) : "—"}
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
                          variant={
                            tx.type === "Achat"
                              ? "info"
                              : tx.type === "Vente"
                                ? "warning"
                                : "success"
                          }
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
                        {tx.unit_price > 0 ? formatPrice(tx.unit_price) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-white">
                        {formatEUR(tx.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-400">
                        {tx.fees > 0 ? formatEUR(tx.fees) : "—"}
                      </td>
                      <td className="px-3 py-4 text-center">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="rounded-lg p-1.5 text-zinc-500 opacity-0 transition-all hover:bg-violet-500/10 hover:text-violet-400 group-hover:opacity-100"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <button
                          onClick={() => handleDeleteClick(tx)}
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

      {/* Add/Edit Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        title={
          editingTransaction ? "Modifier l'opération" : "Ajouter une opération"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                required
              >
                <option value="Achat">Achat</option>
                <option value="Vente">Vente</option>
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
                  setFormData((prev) => ({ ...prev, ticker: val }));
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
                    onClick={async () => {
                      setFormData((prev) => ({
                        ...prev,
                        ticker: result.symbol,
                      }));
                      setSearchResults([]);
                      setTickerSearch("");
                      // Auto-fill price
                      if (
                        formData.type === "Achat" ||
                        formData.type === "Vente"
                      ) {
                        const priceData = await fetchStockPrice(result.symbol);
                        if (priceData) {
                          setFormData((prev) => ({
                            ...prev,
                            unitPrice: priceData.price.toString(),
                            totalAmount: (
                              parseFloat(prev.quantity || "0") * priceData.price
                            ).toFixed(2),
                          }));
                        }
                      }
                    }}
                    className="cursor-pointer px-4 py-2.5 transition-colors hover:bg-zinc-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {result.symbol}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {result.type}
                      </span>
                    </div>
                    <div className="truncate text-sm text-zinc-300">
                      {result.name}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quantity and Unit Price (for Achat/Vente only) */}
          {(formData.type === "Achat" || formData.type === "Vente") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Quantité
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                  step="0.0001"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-zinc-500"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  {formData.type === "Achat"
                    ? "Prix d'achat (€)"
                    : "Prix de vente (€)"}
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
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
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-zinc-500"
              required
              readOnly={formData.type === "Achat" || formData.type === "Vente"}
            />
            {(formData.type === "Achat" || formData.type === "Vente") && (
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
                onChange={handleInputChange}
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
              onClick={() => {
                setIsModalOpen(false);
                setEditingTransaction(null);
              }}
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
                : editingTransaction
                  ? "Modifier"
                  : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        title="Supprimer l'opération"
      >
        <div className="space-y-4">
          <p className="text-zinc-300">
            Êtes-vous sûr de vouloir supprimer l&apos;opération suivante ? Cette
            action est irréversible.
          </p>
          {transactionToDelete && (
            <div className="rounded-xl border border-zinc-800 bg-black/50 p-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    transactionToDelete.type === "Achat"
                      ? "info"
                      : transactionToDelete.type === "Vente"
                        ? "warning"
                        : "success"
                  }
                >
                  {transactionToDelete.type}
                </Badge>
                <span className="font-semibold text-white">
                  {transactionToDelete.ticker}
                </span>
                <span className="text-zinc-500">•</span>
                <span className="font-medium text-white">
                  {formatEUR(transactionToDelete.total_amount)}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                Le{" "}
                {new Date(transactionToDelete.date).toLocaleDateString("fr-FR")}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setTransactionToDelete(null)}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-700 hover:shadow-rose-500/30"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
