"use client";

import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calculator,
  Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import Badge from "@/components/ui/Badge";
const BenchmarkChart = dynamic(() => import("@/components/widgets/BenchmarkChart"), {
  ssr: false,
  loading: () => <ChartSkeleton height={320} />,
});
const RiskAnalysisPanel = dynamic(() => import("@/components/widgets/RiskAnalysisPanel"), {
  ssr: false,
  loading: () => <ChartSkeleton height={240} />,
});
import AnimatedDonut from "@/components/ui/AnimatedDonut";
import PositionSparklineCell from "@/components/ui/PositionSparklineCell";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatEUR, formatPercent, getGeography } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useMemo, useState } from "react";

export default function PortfolioPage() {
  useSettingsStore();
  const [donutView, setDonutView] = useState<"Actions" | "Secteurs" | "Géographie">("Actions");
  const {
    positions,
    history,
    loading,
    refreshing,
    refresh: loadData,
    isRebalancingOpen,
    setIsRebalancingOpen,
    rebalanceCash,
    setRebalanceCash,
    targetAllocations,
    setTargetAllocations,
    totalValue,
  } = usePortfolio();

  const donutData = useMemo(() => {
    const groups = new Map<string, number>();
    for (const p of positions) {
      if (!(p.capitalValue > 0)) continue; // exclut aussi NaN
      const name =
        donutView === "Actions"
          ? p.name || p.ticker
          : donutView === "Secteurs"
            ? p.sector || "Autre"
            : getGeography(p.ticker);
      groups.set(name, (groups.get(name) ?? 0) + p.capitalValue);
    }
    return Array.from(groups, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
  }, [positions, donutView]);

  // ── Loading state premium ────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="stats-card-skeleton h-8 w-48 rounded-lg" />
            <div className="stats-card-skeleton h-4 w-64 rounded-md" />
          </div>
          <div className="stats-card-skeleton h-9 w-28 rounded-xl" />
        </div>
        <ChartSkeleton height={320} />
        <ChartSkeleton height={300} />
      </div>
    );
  }
  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Portefeuille
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Analyse et suivi de vos positions
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Actualiser
        </button>
      </div>

      {/* Benchmark vs Indices */}
      <BenchmarkChart portfolioHistory={history} />

      {/* Répartition du capital (Actions / Secteurs / Géographie) */}
      {!loading && positions.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-black p-6">
          <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <h2 className="text-lg font-bold text-white">
                Répartition du Capital
              </h2>
            </div>

            <div className="flex rounded-lg bg-zinc-800/50 p-1">
              {(["Actions", "Secteurs", "Géographie"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setDonutView(view)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    donutView === view
                      ? "bg-zinc-700 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>
          <AnimatedDonut data={donutData} totalLabel="Portefeuille" />
        </div>
      )}

      {/* Risk Analysis & Quantitative Health Panel */}
      {!loading && positions.length > 0 && (
        <div className="w-full">
          <RiskAnalysisPanel positions={positions} history={history} />
        </div>
      )}

      {/* Portfolio Rebalancing Tool */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black p-6 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
        <div
          className="flex cursor-pointer items-center justify-between"
          onClick={() => setIsRebalancingOpen(!isRebalancingOpen)}
        >
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white">
              Outil de Rééquilibrage
            </h2>
          </div>
          <button className="text-sm font-medium text-violet-400">
            {isRebalancingOpen ? "Fermer" : "Ouvrir"}
          </button>
        </div>

        {isRebalancingOpen && (
          <div className="mt-6 animate-in slide-in-from-top-4 space-y-6 border-t border-zinc-800/50 pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Nouveau dépôt à investir (€)
                </label>
                <input
                  type="number"
                  value={rebalanceCash}
                  onChange={(e) =>
                    setRebalanceCash(parseFloat(e.target.value) || 0)
                  }
                  placeholder="Ex: 500"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
                />
              </div>
              <div className="text-sm text-zinc-400">
                Laissez vide ou entrez un montant pour voir les achats
                recommandés.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-400">
                  <tr>
                    <th className="py-2">Actif</th>
                    <th className="py-2 text-right">Actuel (€)</th>
                    <th className="py-2 text-right">Actuel (%)</th>
                    <th className="py-2 text-right">Cible (%)</th>
                    <th className="py-2 text-right">Action Recommandée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {positions.map((p) => {
                    const currentVal = p.capitalValue || 0;
                    const currentPct =
                      totalValue > 0 ? (currentVal / totalValue) * 100 : 0;
                    const targetPct = targetAllocations[p.ticker] || 0;

                    // Formule de rééquilibrage : (Valeur Totale + Cash) * % Cible - Valeur Actuelle
                    const totalRebalanceTarget = totalValue + rebalanceCash;
                    const idealVal =
                      (totalRebalanceTarget * targetPct) / 100;
                    const diff = idealVal - currentVal;

                    return (
                      <tr key={p.ticker}>
                        <td className="py-3 font-medium text-white">
                          {p.name}
                        </td>
                        <td className="py-3 text-right">
                          {formatEUR(currentVal)}
                        </td>
                        <td className="py-3 text-right">
                          {formatPercent(currentPct / 100)}
                        </td>
                        <td className="py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={targetAllocations[p.ticker] ?? 0}
                            onChange={(e) =>
                              setTargetAllocations({
                                ...targetAllocations,
                                [p.ticker]: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-right text-xs text-white outline-none focus:border-violet-500"
                          />
                        </td>
                        <td
                          className={`py-3 text-right font-bold ${diff >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {diff >= 0 ? "+" : ""}
                          {formatEUR(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span
                  className={`${Object.values(targetAllocations).reduce((a, b) => a + b, 0) > 100 ? "text-rose-400 font-bold" : "text-zinc-500"}`}
                >
                  Total Cible :{" "}
                  {Object.values(targetAllocations)
                    .reduce((a, b) => a + b, 0)
                    .toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Positions Table */}

      {/* Mobile Positions */}
      <div className="space-y-4 md:hidden">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-zinc-900"
              />
            ))
          : positions.map((pos) => {
              const perf =
                pos.totalInvested > 0
                  ? (pos.plusValue || 0) / pos.totalInvested
                  : 0;
              const isPositive = (pos.plusValue || 0) >= 0;

              return (
                <div
                  key={pos.ticker}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm transition-colors hover:bg-zinc-800/30"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="max-w-[150px] truncate font-bold text-white">
                          {pos.name}
                        </p>
                        <p className="text-xs text-zinc-400">{pos.ticker}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PositionSparklineCell
                        ticker={pos.ticker}
                        isPositive={isPositive}
                      />
                      <Badge variant={isPositive ? "success" : "danger"}>
                        {isPositive ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {formatPercent(perf)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-3">
                    <div>
                      <p className="text-xs uppercase text-zinc-400">
                        Valeur
                      </p>
                      <p className="font-semibold text-white">
                        {pos.capitalValue ? formatEUR(pos.capitalValue) : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase text-zinc-400">
                        +/- Value
                      </p>
                      <p
                        className={`font-semibold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {pos.plusValue
                          ? (isPositive ? "+" : "") + formatEUR(pos.plusValue)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-zinc-400">Qté</p>
                      <p className="text-sm text-zinc-300">
                        {pos.totalQuantity.toFixed(4).replace(/\.?0+$/, "")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase text-zinc-400">PRU</p>
                      <p className="text-sm text-zinc-300">
                        {formatEUR(pos.pru)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-6 py-4 text-left font-semibold text-zinc-400">
                  Actif
                </th>
                <th className="px-6 py-4 text-right font-semibold text-zinc-400">
                  Qté
                </th>
                <th className="px-6 py-4 text-right font-semibold text-zinc-400">
                  PRU
                </th>
                <th className="px-6 py-4 text-right font-semibold text-zinc-400">
                  Prix Actuel
                </th>
                <th className="px-6 py-4 text-right font-semibold text-zinc-400">
                  Investi
                </th>
                <th className="px-6 py-4 text-right font-semibold text-zinc-400">
                  Valeur
                </th>
                <th className="px-6 py-4 text-right font-semibold text-zinc-400">
                  +/- Value
                </th>
                <th className="px-6 py-4 text-right font-semibold text-zinc-400">
                  Perf.
                </th>
                <th className="px-6 py-4 text-right font-semibold text-zinc-400">
                  Tendance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-6">
                      <div className="h-5 w-full animate-pulse rounded bg-zinc-800" />
                    </td>
                  </tr>
                ))
              ) : positions.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    Aucune position active. Ajoutez des transactions pour
                    commencer.
                  </td>
                </tr>
              ) : (
                positions.map((pos) => {
                  const perf =
                    pos.totalInvested > 0
                      ? (pos.plusValue || 0) / pos.totalInvested
                      : 0;
                  const isPositive = (pos.plusValue || 0) >= 0;

                  return (
                    <tr
                      key={pos.ticker}
                      className="group transition-colors hover:bg-zinc-800/30"
                    >
                      <td className="px-6 py-4">
                        <div
                          className="font-bold text-white max-w-[150px] truncate"
                          title={pos.name}
                        >
                          {pos.name}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {pos.ticker}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium tabular-nums text-zinc-200">
                        {pos.totalQuantity.toFixed(4).replace(/\.?0+$/, "")}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-zinc-400">
                        {formatEUR(pos.pru)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium tabular-nums text-white">
                        {pos.currentPrice ? formatEUR(pos.currentPrice) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-zinc-400">
                        {formatEUR(pos.totalInvested)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold tabular-nums text-white">
                        {pos.capitalValue ? formatEUR(pos.capitalValue) : "—"}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-medium tabular-nums ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {pos.plusValue
                          ? `${isPositive ? "+" : ""}${formatEUR(pos.plusValue)}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <PositionSparklineCell
                            ticker={pos.ticker}
                            isPositive={isPositive}
                          />
                          <Badge variant={isPositive ? "success" : "danger"}>
                            {isPositive ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {formatPercent(perf)}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
