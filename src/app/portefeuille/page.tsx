"use client";

import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calculator,
} from "lucide-react";
import dynamic from "next/dynamic";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import Badge from "@/components/ui/Badge";
const PortfolioHistoryChart = dynamic(() => import("@/components/PortfolioHistoryChart"), { ssr: false });
import AnimatedDonut from "@/components/ui/AnimatedDonut";
import PositionSparklineCell from "@/components/ui/PositionSparklineCell";
import { StatsCardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatEUR, formatPercent } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";



export default function PortfolioPage() {
  useSettingsStore();
  const {
    positions,
    filteredHistory,
    timeRange,
    setTimeRange,
    loading,
    refreshing,
    refresh: loadData,
    isRebalancingOpen,
    setIsRebalancingOpen,
    rebalanceCash,
    setRebalanceCash,
    targetAllocations,
    setTargetAllocations,
    totalInvested,
    totalValue,
    totalPV,
    totalPerformance,
    sectorData,
    assetData,
  } = usePortfolio();

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
        <div className="grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <StatsCardSkeleton key={i} index={i} />
          ))}
        </div>
        <ChartSkeleton height={300} />
        <div className="grid gap-6 md:grid-cols-2">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>
      </div>
    );
  }
  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Mon Portefeuille
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Vue détaillée de vos positions et de leur performance
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualiser
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6 backdrop-blur">
          <p className="text-xs sm:text-sm font-medium text-zinc-400">Valeur Totale</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold text-white">
            {loading ? "..." : formatEUR(totalValue)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6 backdrop-blur">
          <p className="text-xs sm:text-sm font-medium text-zinc-400">Investissement</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold text-zinc-200">
            {loading ? "..." : formatEUR(totalInvested)}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6 backdrop-blur">
          <p className="text-xs sm:text-sm font-medium text-zinc-400">Plus/Moins-Value</p>
          <div className="mt-1 sm:mt-2 flex items-baseline gap-2">
            <p
              className={`text-2xl sm:text-3xl font-bold ${
                totalPV >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {loading ? "..." : (totalPV > 0 ? "+" : "") + formatEUR(totalPV)}
            </p>
            <span
              className={`text-xs sm:text-sm font-medium ${
                totalPerformance >= 0 ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              ({loading ? "..." : formatPercent(totalPerformance)})
            </span>
          </div>
        </div>
      </div>

      {/* History Chart */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Évolution du Portefeuille
          </h3>
          <div className="flex gap-1 rounded-lg bg-zinc-800/50 p-1">
            {(["1W", "1M", "1Y", "Max"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  timeRange === range
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px] w-full">
          <PortfolioHistoryChart filteredHistory={filteredHistory} />
        </div>
      </div>

      {/* Allocation Charts */}
      {!loading && positions.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Sector Allocation — AnimatedDonut interactif */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Répartition Sectorielle
            </h3>
            <AnimatedDonut
              data={sectorData}
              height={300}
              totalValue={sectorData.reduce((s, d) => s + d.value, 0)}
              totalLabel="Secteurs"
            />
          </div>

          {/* Asset Allocation — AnimatedDonut interactif */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Répartition par Actif
            </h3>
            <AnimatedDonut
              data={assetData}
              height={300}
              totalValue={assetData.reduce((s, d) => s + d.value, 0)}
              totalLabel="Actifs"
            />
          </div>
        </div>
      )}

      {/* Portfolio Rebalancing Tool */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black p-6 backdrop-blur-sm shadow-[0_0_15px_rgba(139,92,246,0.1)]">
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
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
                />
              </div>
              <div className="text-sm text-zinc-400">
                Capital cible total :{" "}
                <strong className="text-white">
                  {formatEUR(totalValue + rebalanceCash)}
                </strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-zinc-400">
                    <th className="pb-3 font-medium">Actif</th>
                    <th className="pb-3 text-right font-medium">
                      Allocation actuelle
                    </th>
                    <th className="pb-3 text-center font-medium">
                      Allocation cible (%)
                    </th>
                    <th className="pb-3 text-right font-medium">
                      À Acheter/Vendre (€)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/20">
                  {positions.map((pos) => {
                    const currentPct =
                      totalValue > 0
                        ? ((pos.capitalValue || 0) / totalValue) * 100
                        : 0;
                    const targetPct = targetAllocations[pos.ticker] || 0;
                    const targetCap =
                      (totalValue + rebalanceCash) * (targetPct / 100);
                    const diff = targetCap - (pos.capitalValue || 0);

                    return (
                      <tr key={pos.ticker}>
                        <td className="py-3 text-zinc-200">
                          {pos.name}{" "}
                          <span className="text-xs text-zinc-500">
                            ({pos.ticker})
                          </span>
                        </td>
                        <td className="py-3 text-right text-zinc-400">
                          {currentPct.toFixed(1)}%
                        </td>
                        <td className="py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={targetPct.toFixed(1)}
                            onChange={(e) =>
                              setTargetAllocations((prev) => ({
                                ...prev,
                                [pos.ticker]: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-20 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-center text-zinc-200 outline-none focus:border-violet-500"
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
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm backdrop-blur-sm transition-colors hover:bg-zinc-800/30"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="max-w-[150px] truncate font-bold text-white">
                          {pos.name}
                        </p>
                        <p className="text-xs text-zinc-500">{pos.ticker}</p>
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
                      <p className="text-[10px] uppercase text-zinc-500">
                        Valeur
                      </p>
                      <p className="font-semibold text-white">
                        {pos.capitalValue ? formatEUR(pos.capitalValue) : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-zinc-500">
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
                      <p className="text-[10px] uppercase text-zinc-500">Qté</p>
                      <p className="text-sm text-zinc-300">
                        {pos.totalQuantity.toFixed(4).replace(/\.?0+$/, "")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-zinc-500">PRU</p>
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
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black backdrop-blur-sm md:block">
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
                        <div className="text-xs text-zinc-500">
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
