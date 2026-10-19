"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { fetchStockPrice } from "@/lib/data";
import { parseTransactionsCSV, transactionsToCSV } from "@/lib/csv";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction, TransactionPayload } from "@/lib/types";
import { formatEUR, formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface SearchResult {
  ticker: string;
  name: string;
  type: string;
  exchange: string;
}

import { useSettingsStore } from "@/stores/useSettingsStore";

const emptyForm = () => ({
  // Local day: toISOString() gives the UTC day, i.e. yesterday between 00:00 and 02:00 in Paris
  date: new Date().toLocaleDateString("sv-SE"),
  type: "Achat" as "Achat" | "Dividende" | "Vente",
  ticker: "",
  quantity: "",
  unitPrice: "",
  totalAmount: "",
  fees: "",
});

export default function TransactionsPage() {
  useSettingsStore();
  const { transactions, isLoading: loading, isError, addTransaction, importTransactions, updateTransaction, deleteTransaction } = useTransactions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [isImporting, setIsImporting] = useState(false);
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

  // Remove loadData function completely

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
    const blob = new Blob([transactionsToCSV(sortedTransactions)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `myfinances_transactions_${new Date().toLocaleDateString("sv-SE")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const parsed = parseTransactionsCSV(await file.text());
      if ("error" in parsed) {
        toast.error(`Import annulé, rien n'a été ajouté : ${parsed.error}`);
        return;
      }
      // Same operation already stored (or twice in the file) → skipped, so re-importing an export adds nothing
      const keyOf = (t: TransactionPayload) =>
        [t.date, t.type, t.ticker, t.quantity, t.total_amount].join("|");
      const seen = new Set(transactions.map(keyOf));
      const toImport: TransactionPayload[] = [];
      for (const tx of parsed.data) {
        if (seen.has(keyOf(tx))) continue;
        seen.add(keyOf(tx));
        toImport.push(tx);
      }
      const skipped = parsed.data.length - toImport.length;

      if (toImport.length === 0) {
        toast.error("Aucune nouvelle ligne valide trouvée dans le fichier CSV.");
        return;
      }

      await importTransactions(toImport);
      toast.success(
        `Import réussi : ${toImport.length} opération(s) ajoutée(s)${skipped > 0 ? `, ${skipped} ignorée(s)` : ""}.`,
      );
    } catch (err) {
      toast.error(`Import annulé, rien n'a été ajouté : ${(err as Error).message}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openAdd = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleSave = async (tx: TransactionPayload) => {
    setSubmitting(true);
    try {
      await (editingTransaction
        ? updateTransaction({ id: editingTransaction.id, tx })
        : addTransaction(tx));
      // React Query invalidates and refetches automatically
      closeModal();
      toast.success(
        editingTransaction ? "Opération modifiée" : "Opération ajoutée",
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
    setSubmitting(false);
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;

    setDeletingId(transactionToDelete.id);
    try {
      await deleteTransaction(transactionToDelete.id);
      // React Query invalidates automatically
      toast.success("Opération supprimée");
    } catch (err) {
      toast.error(`Erreur lors de la suppression : ${(err as Error).message}`);
    }
    setDeletingId(null);
    setTransactionToDelete(null);
  };

  const handleDeleteClick = (tx: Transaction) => {
    setTransactionToDelete(tx);
  };

  const sortIcon = (colKey: keyof Transaction) => {
    if (sortKey !== colKey)
      return <ChevronsUpDown className="ml-1 h-3 w-3 text-slate-600" />;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3 text-emerald-500" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 text-emerald-500" />
    );
  };

  const ariaSort = (colKey: keyof Transaction) =>
    sortKey !== colKey ? "none" : sortDir === "asc" ? "ascending" : "descending";

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
          onClick={openAdd}
          aria-label="Ajouter une opération"
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
            disabled={isImporting}
            className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
            title="Importer CSV"
            aria-label="Importer CSV"
          >
            <Upload className={`h-4 w-4 ${isImporting ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
            title="Exporter CSV"
            aria-label="Exporter CSV"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={openAdd}
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

      {isError && (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400"
        >
          Impossible de charger les opérations : la liste affichée peut être
          incomplète.
        </p>
      )}

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
                className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm"
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
                      aria-label="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(tx)}
                      className="p-1 text-zinc-500 hover:text-rose-400"
                      title="Supprimer"
                      aria-label="Supprimer"
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
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th
                  aria-sort={ariaSort("date")}
                  className="px-6 py-4 text-left font-semibold text-zinc-400"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("date")}
                    className="flex w-full cursor-pointer items-center gap-2 hover:text-white"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Date{" "}
                    {sortIcon("date")}
                  </button>
                </th>
                <th
                  aria-sort={ariaSort("type")}
                  className="px-6 py-4 text-center font-semibold text-zinc-400"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("type")}
                    className="flex w-full cursor-pointer items-center justify-center gap-1 hover:text-white"
                  >
                    Type {sortIcon("type")}
                  </button>
                </th>
                <th
                  aria-sort={ariaSort("ticker")}
                  className="px-6 py-4 text-left font-semibold text-zinc-400"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("ticker")}
                    className="flex w-full cursor-pointer items-center gap-1 hover:text-white"
                  >
                    Ticker {sortIcon("ticker")}
                  </button>
                </th>
                <th
                  aria-sort={ariaSort("quantity")}
                  className="px-6 py-4 text-right font-semibold text-zinc-400"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("quantity")}
                    className="flex w-full cursor-pointer items-center justify-end gap-1 hover:text-white"
                  >
                    Quantité {sortIcon("quantity")}
                  </button>
                </th>
                <th
                  aria-sort={ariaSort("unit_price")}
                  className="px-6 py-4 text-right font-semibold text-zinc-400"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("unit_price")}
                    className="flex w-full cursor-pointer items-center justify-end gap-1 hover:text-white"
                  >
                    Prix Unit. {sortIcon("unit_price")}
                  </button>
                </th>
                <th
                  aria-sort={ariaSort("total_amount")}
                  className="px-6 py-4 text-right font-semibold text-zinc-400"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("total_amount")}
                    className="flex w-full cursor-pointer items-center justify-end gap-1 hover:text-white"
                  >
                    Montant {sortIcon("total_amount")}
                  </button>
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
                          className="rounded-lg p-1.5 text-zinc-500 opacity-0 transition-all hover:bg-violet-500/10 hover:text-violet-400 group-hover:opacity-100 focus-visible:opacity-100"
                          title="Modifier"
                          aria-label="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <button
                          onClick={() => handleDeleteClick(tx)}
                          disabled={deletingId === tx.id}
                          className="rounded-lg p-1.5 text-zinc-500 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
                          title="Supprimer"
                          aria-label="Supprimer"
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
        onClose={closeModal}
        title={
          editingTransaction ? "Modifier l'opération" : "Ajouter une opération"
        }
      >
        <TransactionForm
          transaction={editingTransaction}
          submitting={submitting}
          onSave={handleSave}
          onCancel={closeModal}
        />
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
              disabled={deletingId !== null}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-700 hover:shadow-rose-500/30 disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** Add/edit form: owns its state so typing doesn't re-render every table row. */
function TransactionForm({
  transaction,
  submitting,
  onSave,
  onCancel,
}: {
  transaction: Transaction | null;
  submitting: boolean;
  onSave: (tx: TransactionPayload) => void;
  onCancel: () => void;
}) {
  // Modal renders nothing while closed, so this runs on every open: add starts empty, edit from the row
  const [formData, setFormData] = useState(() =>
    transaction
      ? {
          date: transaction.date,
          type: transaction.type,
          ticker: transaction.ticker,
          quantity: transaction.quantity.toString(),
          unitPrice: transaction.unit_price.toString(),
          totalAmount: transaction.total_amount.toString(),
          fees: transaction.fees.toString(),
        }
      : emptyForm(),
  );

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
            `/api/stock/search?q=${encodeURIComponent(tickerSearch)}`,
          );
          const data = await res.json();
          setSearchResults(Array.isArray(data?.results) ? data.results : []);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ticker: formData.ticker,
      type: formData.type,
      date: formData.date,
      quantity: parseFloat(formData.quantity) || 0,
      unit_price: parseFloat(formData.unitPrice) || 0,
      total_amount: parseFloat(formData.totalAmount) || 0,
      fees: parseFloat(formData.fees) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date and Type (stacked on phones: the native date picker needs the width) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="tx-date"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Date
          </label>
          <input
            id="tx-date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            required
          />
        </div>
        <div>
          <label
            htmlFor="tx-type"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Type
          </label>
          <select
            id="tx-type"
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
        <label
          htmlFor="tx-ticker"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Actif (Ticker)
        </label>
        <div className="relative">
          <input
            id="tx-ticker"
            type="text"
            value={formData.ticker}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setFormData((prev) => ({ ...prev, ticker: val }));
              // Always set: if 1-char input were skipped, retyping the same 2 characters would never search again
              setTickerSearch(val);
              if (val.length <= 1) setSearchResults([]);
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
              <li key={result.ticker}>
                <button
                  type="button"
                  onClick={async () => {
                    setFormData((prev) => ({
                      ...prev,
                      ticker: result.ticker,
                    }));
                    setSearchResults([]);
                    setTickerSearch("");
                    // Auto-fill price
                    if (formData.type === "Achat" || formData.type === "Vente") {
                      const priceData = await fetchStockPrice(result.ticker);
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
                  className="w-full cursor-pointer px-4 py-2.5 text-left transition-colors hover:bg-zinc-700 focus-visible:bg-zinc-700"
                >
                  <span className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      {result.ticker}
                    </span>
                    <span className="text-xs text-zinc-400">{result.type}</span>
                  </span>
                  <span className="block truncate text-sm text-zinc-300">
                    {result.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quantity and Unit Price (for Achat/Vente only) */}
      {(formData.type === "Achat" || formData.type === "Vente") && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="tx-quantity"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Quantité
            </label>
            <input
              id="tx-quantity"
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
            <label
              htmlFor="tx-unit-price"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              {formData.type === "Achat"
                ? "Prix d'achat (€)"
                : "Prix de vente (€)"}
            </label>
            <input
              id="tx-unit-price"
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
        <label
          htmlFor="tx-total"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Montant total (€)
        </label>
        <input
          id="tx-total"
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
          <label htmlFor="tx-fees" className="sr-only">
            Frais (€)
          </label>
          <input
            id="tx-fees"
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
          {submitting ? "Enregistrement..." : transaction ? "Modifier" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}
