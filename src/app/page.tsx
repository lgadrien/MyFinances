"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  Wallet,
  TrendingUp,
  Activity,
  PiggyBank,
  Target,
  Coins,
  Settings2,
  Save,
} from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import { StatsCardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import PositionSparklineCell from "@/components/ui/PositionSparklineCell";
import { useDashboard } from "@/hooks/useDashboard";
import { useCountUp } from "@/hooks/useCountUp";
import { formatEUR, formatPercent, formatPrice } from "@/lib/utils";

const PortfolioHistoryChart = dynamic(
  () => import("@/components/PortfolioHistoryChart"),
  { ssr: false, loading: () => <ChartSkeleton height={300} /> },
);

const DividendCalendar = dynamic(
  () => import("@/components/widgets/DividendCalendar"),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> },
);

import { useSettingsStore } from "@/stores/useSettingsStore";

/** Montant précédé de ▲/▼ : le signe ne repose pas que sur la couleur */
const signedEUR = (up: boolean) => (n: number) => `${up ? "▲" : "▼"} ${formatEUR(n)}`;

export default function DashboardPage() {
  useSettingsStore();
  const {
    positions,
    dividendHistory,
    projectedDividends,
    filteredHistory,
    timeRange,
    setTimeRange,
    dailyChange,
    totalInvested,
    totalPlusValue,
    totalCapital,
    cashBalance,
    targetCapital,
    loading,
    savingSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    setCashBalance,
    setTargetCapital,
    handleSaveSettings,
  } = useDashboard();

  // CountUp pour la progress bar du capital total
  const animatedCapital = useCountUp(loading ? 0 : totalCapital + cashBalance, {
    duration: 1200,
    delay: 360,
  });
  const progressPct = Math.min(
    (animatedCapital / (targetCapital || 1)) * 100,
    100,
  );

  // Le sens de la flèche suit la valeur finale, pas le compteur animé qui part de 0
  const plusValueEUR = signedEUR(totalPlusValue >= 0);
  const dailyEUR = signedEUR(dailyChange.amount >= 0);

  const receivedByMonth = React.useMemo(() => {
    const map: Record<string, number> = {};
    dividendHistory.forEach((d) => {
      map[d.month] = d.amount;
    });
    return map;
  }, [dividendHistory]);

  const projectedByMonth = React.useMemo(() => {
    const map: Record<string, number> = {};
    projectedDividends.forEach((d) => {
      map[d.month] = d.amount;
    });
    return map;
  }, [projectedDividends]);

  // ── Loading state avec skeletons premium ────────────────────────
  if (loading) {
    return (
      <div className="animate-fade-in space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="stats-card-skeleton h-8 w-32 rounded-lg" />
            <div className="stats-card-skeleton h-4 w-56 rounded-md" />
          </div>
          <div className="stats-card-skeleton h-9 w-32 rounded-xl" />
        </div>

        {/* StatsCards skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} index={i} />
          ))}
        </div>

        {/* Chart skeleton */}
        <ChartSkeleton height={320} />

        {/* Table skeleton */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
          <div className="stats-card-skeleton mb-4 h-6 w-44 rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-4">
                <div className="stats-card-skeleton h-4 w-32 rounded-md" />
                <div className="stats-card-skeleton h-4 w-16 rounded-md" />
                <div className="stats-card-skeleton h-4 w-20 rounded-md" />
                <div className="stats-card-skeleton h-4 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* ── Header & Settings Toggle ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Vue d&apos;ensemble de votre portefeuille PEA
          </p>
        </div>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="flex items-center gap-2 rounded-xl border border-zinc-800/60 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Configuration</span>
        </button>
      </div>

      {/* ── Settings Panel ───────────────────────────────────────── */}
      {isSettingsOpen && (
        <div className="animate-in slide-in-from-top-4 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white">Paramètres</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Liquidités non investies (Cash) €
              </label>
              <input
                type="number"
                value={cashBalance}
                onChange={(e) =>
                  setCashBalance(parseFloat(e.target.value) || 0)
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Objectif de Capital Total €
              </label>
              <input
                type="number"
                value={targetCapital}
                onChange={(e) =>
                  setTargetCapital(parseFloat(e.target.value) || 0)
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              disabled={savingSettings}
              onClick={handleSaveSettings}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2 text-sm font-medium text-white transition-all hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-50"
            >
              <Save
                className={`h-4 w-4 ${savingSettings ? "animate-pulse" : ""}`}
              />
              {savingSettings ? "Chargement..." : "Sauvegarder"}
            </button>
          </div>
        </div>
      )}

      {/* ── Stats Cards (avec countUp + stagger) ─────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 2xl:grid-cols-4">
        <div className="col-span-2 2xl:col-span-1">
          <StatsCard
            label="Total Investi"
            rawValue={totalInvested}
            value={formatEUR(totalInvested)}
            formatValue={formatEUR}
            icon={Wallet}
            accentColor="violet"
            index={0}
          />
        </div>
        <StatsCard
          label="Plus-Value"
          rawValue={totalPlusValue}
          value={plusValueEUR(totalPlusValue)}
          formatValue={plusValueEUR}
          icon={TrendingUp}
          trend={{
            value:
              totalInvested > 0
                ? formatPercent(totalPlusValue / totalInvested)
                : formatPercent(0),
            positive: totalPlusValue >= 0,
          }}
          accentColor={totalPlusValue >= 0 ? "emerald" : "red"}
          index={1}
        />
        <StatsCard
          label="Variation du Jour"
          rawValue={dailyChange.amount}
          value={dailyEUR(dailyChange.amount)}
          formatValue={dailyEUR}
          icon={Activity}
          trend={{
            value: formatPercent(dailyChange.percent),
            positive: dailyChange.amount >= 0,
          }}
          accentColor={dailyChange.amount >= 0 ? "emerald" : "red"}
          index={2}
        />

        {/* Capital Total — carte custom avec progress bar animée */}
        <div
          className="col-span-2 2xl:col-span-1 group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-violet-500/10 to-violet-600/5 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700/60 hover:shadow-xl hover:shadow-violet-500/10"
          style={{
            animationDelay: "240ms",
            animation: "statsCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-violet-500/20 to-violet-600/5 opacity-50 blur-2xl transition-opacity group-hover:opacity-80" />

          <div className="relative flex items-start justify-between">
            <div className="flex-1 pr-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Capital Total (incl. Cash)
              </p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-white tabular-nums">
                {formatEUR(animatedCapital)}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-white/5 transition-transform group-hover:scale-110">
              <PiggyBank className="h-5 w-5 text-violet-400" />
            </div>
          </div>

          {/* Progress bar animée */}
          <div className="relative mt-4">
            <div className="mb-1.5 flex justify-between text-xs text-zinc-400">
              <span>Objectif : {formatEUR(targetCapital)}</span>
              <span className="font-semibold text-violet-400">
                {formatPercent(progressPct / 100)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-1000 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Évolution du Portefeuille ────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-black p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Évolution du Portefeuille
          </h2>
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

      {/* Capital et Liquidités */}
      <div className="animate-glow-pulse rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-black p-6 shadow-[0_0_20px_rgba(139,92,246,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-fuchsia-400" />
            <h2 className="text-lg font-bold text-white">
              Capital et Liquidités
            </h2>
          </div>
          <span className="rounded-full bg-fuchsia-500/10 px-2.5 py-0.5 text-xs font-semibold text-fuchsia-400 ring-1 ring-fuchsia-500/20">
            PEA
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between rounded-xl bg-zinc-900/30 px-4 py-3 text-sm">
            <span className="text-zinc-400">Actions (Investi + PV)</span>
            <span className="font-semibold text-white">
              {formatEUR(totalCapital)}
            </span>
          </div>
          <div className="flex justify-between rounded-xl bg-zinc-900/30 px-4 py-3 text-sm">
            <span className="text-zinc-400">Poche Espèces (Cash)</span>
            <span className="font-semibold text-white">
              {formatEUR(cashBalance)}
            </span>
          </div>
          <div className="flex justify-between rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
            <span className="font-bold text-zinc-200">TOTAL PEA</span>
            <span className="font-bold text-violet-400">
              {formatEUR(totalCapital + cashBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Dividendes : total reçu + calendrier annuel ── */}
      <div className="w-full">
        <DividendCalendar
          receivedByMonth={receivedByMonth}
          projectedByMonth={projectedByMonth}
        />
      </div>

      {/* ── Positions du Portefeuille ─────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-black p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-white">
          Positions du Portefeuille
        </h2>
        
        {/* Vue Desktop : Tableau */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left font-semibold text-zinc-400">
                  Action
                </th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-400">
                  Qté
                </th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-400">
                  PRU
                </th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-400">
                  Prix Actuel
                </th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-400">
                  Investi
                </th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-400">
                  Valeur
                </th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-400">
                  +/- Value
                </th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-400">
                  Tendance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {positions.map((pos) => {
                const isPositive = (pos.plusValue || 0) >= 0;
                return (
                  <tr
                    key={pos.ticker}
                    className="group transition-colors hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-white">{pos.name}</p>
                        <p className="text-xs text-zinc-400">{pos.ticker}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-200">
                      {pos.totalQuantity}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-200">
                      {formatPrice(pos.pru)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-200">
                      {pos.currentPrice ? formatPrice(pos.currentPrice) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-200">
                      {formatEUR(pos.totalInvested)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-200">
                      {formatEUR(pos.capitalValue || 0)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold tabular-nums ${
                        isPositive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {formatEUR(pos.plusValue || 0)}
                    </td>
                    {/* Sparkline */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end">
                        <PositionSparklineCell
                          ticker={pos.ticker}
                          isPositive={isPositive}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Vue Mobile : Cartes */}
        <div className="grid gap-4 md:hidden">
          {positions.map((pos) => {
            const isPositive = (pos.plusValue || 0) >= 0;
            return (
              <div
                key={pos.ticker}
                className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 transition-all hover:bg-zinc-800/40"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white">{pos.name}</p>
                    <p className="text-xs text-zinc-400">{pos.ticker}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">
                      {formatEUR(pos.capitalValue || 0)}
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        isPositive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {formatEUR(pos.plusValue || 0)}
                    </p>
                  </div>
                </div>
                
                <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg bg-black/40 p-3 text-xs">
                  <div>
                    <span className="block text-zinc-500">Qté</span>
                    <span className="font-medium text-zinc-200">{pos.totalQuantity}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500">PRU</span>
                    <span className="font-medium text-zinc-200">{formatPrice(pos.pru)}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500">Prix Actuel</span>
                    <span className="font-medium text-zinc-200">
                      {pos.currentPrice ? formatPrice(pos.currentPrice) : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-zinc-500">Investi</span>
                    <span className="font-medium text-zinc-200">{formatEUR(pos.totalInvested)}</span>
                  </div>
                </div>
                
                <div className="flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900/80">
                  <PositionSparklineCell
                    ticker={pos.ticker}
                    isPositive={isPositive}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
