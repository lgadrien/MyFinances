"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ArrowLeftRight, Calendar, Filter, Trash2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  fetchTransactions,
  insertTransaction,
  deleteTransaction,
} from "@/lib/data";
import type { Transaction } from "@/lib/calculations";
import { FRENCH_INSTRUMENTS } from "@/lib/french-instruments";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "Achat" as "Achat" | "Dividende",
    ticker: "",
    quantity: "",
    unitPrice: "",
    totalAmount: "",
    fees: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const txData = await fetchTransactions();
    setTransactions(txData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTransactions = transactions.filter(
    (t) => filterType === "all" || t.type === filterType,
  );

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

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Historique de vos opérations
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/30"
        >
          <Plus className="h-4 w-4" />
          Ajouter une opération
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-slate-500" />
        {["all", "Achat", "Dividende"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filterType === type
                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
          >
            {type === "all" ? "Toutes" : type}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">
          {filteredTransactions.length} opération(s)
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/50 to-slate-800/20 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-6 py-4 text-left font-semibold text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" /> Date
                </div>
              </th>
              <th className="px-6 py-4 text-center font-semibold text-slate-400">
                Type
              </th>
              <th className="px-6 py-4 text-left font-semibold text-slate-400">
                Ticker
              </th>
              <th className="px-6 py-4 text-right font-semibold text-slate-400">
                Quantité
              </th>
              <th className="px-6 py-4 text-right font-semibold text-slate-400">
                Prix Unit.
              </th>
              <th className="px-6 py-4 text-right font-semibold text-slate-400">
                Montant
              </th>
              <th className="px-6 py-4 text-right font-semibold text-slate-400">
                Frais
              </th>
              <th className="w-12 px-3 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-5">
                      <div className="h-4 animate-pulse rounded bg-slate-800" />
                    </td>
                  </tr>
                ))
              : filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="group transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {new Date(tx.date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={tx.type === "Achat" ? "info" : "success"}>
                        <ArrowLeftRight className="h-3 w-3" />
                        {tx.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white">
                        {tx.ticker}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-200">
                      {tx.quantity > 0 ? tx.quantity : "—"}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-200">
                      {tx.unit_price > 0
                        ? `${tx.unit_price.toFixed(2)} €`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      {formatEUR(tx.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400">
                      {tx.fees > 0 ? formatEUR(tx.fees) : "—"}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <button
                        onClick={() => handleDelete(tx)}
                        disabled={deletingId === tx.id}
                        className="rounded-lg p-1.5 text-slate-500 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
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

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Ticker
            </label>
            <select
              name="ticker"
              value={formData.ticker}
              onChange={handleInputChange}
              className={inputClasses}
              required
            >
              <option value="">Sélectionner un actif</option>
              {FRENCH_INSTRUMENTS.filter((i) => i.category === "Action").map(
                (i) => (
                  <option key={i.ticker} value={i.ticker}>
                    {i.ticker} — {i.name}
                  </option>
                ),
              )}
            </select>
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
