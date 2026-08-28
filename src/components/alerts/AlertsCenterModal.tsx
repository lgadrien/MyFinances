"use client";

import { useState } from "react";
import {
  Bell,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import {
  useAlerts,
  getAlertLabel,
  type AlertType,
} from "@/hooks/useAlerts";
import { FRENCH_INSTRUMENTS } from "@/lib/french-instruments";

interface AlertsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTicker?: string;
  initialPrice?: number;
}

export default function AlertsCenterModal({
  isOpen,
  onClose,
  initialTicker = "",
  initialPrice = 0,
}: AlertsCenterModalProps) {
  const {
    alerts,
    createAlert,
    deleteAlert,
    toggleAlert,
  } = useAlerts();

  const [activeTab, setActiveTab] = useState<"list" | "create">(
    initialTicker ? "create" : "list",
  );

  // Create form state
  const [ticker, setTicker] = useState(initialTicker || "AIR.PA");
  const [alertType, setAlertType] = useState<AlertType>("PRICE_ABOVE");
  const [threshold, setThreshold] = useState<number>(
    initialPrice > 0 ? Math.round(initialPrice * 1.05 * 100) / 100 : 150,
  );

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || isNaN(threshold) || threshold <= 0) return;

    const instrument = FRENCH_INSTRUMENTS.find(
      (i) => i.ticker.toUpperCase() === ticker.toUpperCase(),
    );

    await createAlert({
      ticker,
      name: instrument?.name || ticker,
      type: alertType,
      threshold,
    });

    setActiveTab("list");
  };

  const getIcon = (type: AlertType) => {
    switch (type) {
      case "PRICE_ABOVE":
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case "PRICE_BELOW":
        return <TrendingDown className="h-4 w-4 text-rose-400" />;
      case "RSI_OVERSOLD":
        return <Activity className="h-4 w-4 text-emerald-400" />;
      case "RSI_OVERBOUGHT":
        return <Activity className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 ring-1 ring-violet-500/30">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Centre d&apos;Alertes & Objectifs
              </h2>
              <p className="text-xs text-zinc-400">
                Surveillance automatique des cours et signaux RSI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 px-6 pt-2">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === "list"
                ? "border-violet-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Mes alertes</span>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
              {alerts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === "create"
                ? "border-violet-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle alerte</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {activeTab === "create" ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Actif à surveiller
                </label>
                <select
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                >
                  {FRENCH_INSTRUMENTS.map((inst) => (
                    <option key={inst.ticker} value={inst.ticker}>
                      {inst.name} ({inst.ticker}) — {inst.sector}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Condition de déclenchement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "PRICE_ABOVE", label: "Cours ≥ Seuil haut", icon: TrendingUp },
                    { id: "PRICE_BELOW", label: "Cours ≤ Seuil bas", icon: TrendingDown },
                    { id: "RSI_OVERSOLD", label: "RSI ≤ 30 (Survente)", icon: Activity },
                    { id: "RSI_OVERBOUGHT", label: "RSI ≥ 70 (Surachat)", icon: Activity },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setAlertType(opt.id as AlertType);
                        if (opt.id === "RSI_OVERSOLD") setThreshold(30);
                        else if (opt.id === "RSI_OVERBOUGHT") setThreshold(70);
                      }}
                      className={`flex items-center gap-2 rounded-xl p-3 text-left text-xs font-semibold transition-all ${
                        alertType === opt.id
                          ? "bg-violet-600/20 text-white ring-1 ring-violet-500"
                          : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      <opt.icon className="h-4 w-4 shrink-0 text-violet-400" />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {alertType.startsWith("PRICE") ? "Seuil de prix (€)" : "Seuil RSI (0 à 100)"}
                </label>
                <input
                  type="number"
                  step={alertType.startsWith("PRICE") ? "0.01" : "1"}
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-fuchsia-700"
                >
                  Activer l&apos;alerte
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
                  <p className="text-sm font-medium text-zinc-300">
                    Aucune alerte configurée pour le moment
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Soyez notifié dès qu&apos;une action atteint un objectif de cours ou un RSI clé.
                  </p>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-violet-700"
                  >
                    <Plus className="h-4 w-4" />
                    Créer ma première alerte
                  </button>
                </div>
              ) : (
                alerts.map((alert) => {
                  const isTriggered = alert.status === "TRIGGERED";
                  const isActive = alert.status === "ACTIVE";

                  return (
                    <div
                      key={alert.id}
                      className={`relative rounded-xl border p-4 transition-all ${
                        isTriggered
                          ? "border-violet-500/40 bg-violet-500/10"
                          : isActive
                            ? "border-zinc-800 bg-zinc-900/60"
                            : "border-zinc-800/40 bg-zinc-950/40 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-lg bg-zinc-800 p-2">
                            {getIcon(alert.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                {alert.name}
                              </span>
                              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                                {alert.ticker}
                              </span>
                              {isTriggered && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300 ring-1 ring-violet-500/30 animate-pulse">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Déclenchée !
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-medium text-zinc-300 mt-1">
                              {getAlertLabel(alert.type, alert.threshold)}
                            </p>
                            {alert.message && (
                              <p className="text-xs text-violet-300 mt-1 font-medium">
                                {alert.message}
                              </p>
                            )}
                            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Créée le {new Date(alert.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAlert(alert.id)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            {isActive ? "Active" : "En pause"}
                          </button>
                          <button
                            onClick={() => deleteAlert(alert.id)}
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
