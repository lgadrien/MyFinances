"use client";

import { useMemo } from "react";
import {
  ShieldCheck,
  TrendingDown,
  Activity,
  Award,
  PieChart,
  Info,
} from "lucide-react";
import {
  computePortfolioRiskMetrics,
  type PortfolioRiskMetrics,
} from "@/lib/risk-metrics";
import type { EnrichedPortfolioPosition } from "@/hooks/usePortfolio";
import { formatEUR, formatPercent } from "@/lib/utils";

interface RiskAnalysisPanelProps {
  positions: EnrichedPortfolioPosition[];
  history: { total_value: number; date?: string }[];
  totalInvested: number;
  totalValue: number;
}

export default function RiskAnalysisPanel({
  positions,
  history,
  totalInvested,
  totalValue,
}: RiskAnalysisPanelProps) {
  const metrics: PortfolioRiskMetrics = useMemo(() => {
    return computePortfolioRiskMetrics(
      history,
      positions,
      totalInvested,
      totalValue,
    );
  }, [history, positions, totalInvested, totalValue]);

  const { diversification, sharpeRatio, annualizedVolatility, maxDrawdown } =
    metrics;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 55) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const getSharpeBadge = (sharpe: number) => {
    if (sharpe >= 2) return { text: "Exceptionnel", color: "text-emerald-400 bg-emerald-500/10" };
    if (sharpe >= 1) return { text: "Très bon", color: "text-emerald-400 bg-emerald-500/10" };
    if (sharpe > 0) return { text: "Positif", color: "text-amber-400 bg-amber-500/10" };
    return { text: "Sous-optimal", color: "text-rose-400 bg-rose-500/10" };
  };

  const sharpeBadge = getSharpeBadge(sharpeRatio);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-black p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(139,92,246,0.06)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 ring-1 ring-violet-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Analyse du Risque & Diversification
            </h2>
            <p className="text-xs text-zinc-400">
              Métriques quantitatives de santé et de résilience patrimoniale
            </p>
          </div>
        </div>

        {/* Global Score Badge */}
        <div
          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-1.5 ${getScoreColor(
            diversification.score,
          )}`}
        >
          <Award className="h-4 w-4" />
          <div>
            <span className="text-xs font-semibold block leading-none">
              Score Diversification
            </span>
            <span className="text-sm font-extrabold">
              {diversification.score} / 100 • {diversification.level}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of 4 key metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-6">
        {/* Sharpe Ratio */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Ratio de Sharpe</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${sharpeBadge.color}`}
            >
              {sharpeBadge.text}
            </span>
          </div>
          <p className="text-xl font-bold text-white">
            {sharpeRatio.toFixed(2)}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            Rendement excédentaire par unité de risque (taux sans risque 3%)
          </p>
        </div>

        {/* Volatility */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Volatilité (σ)</span>
            <Activity className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <p className="text-xl font-bold text-white">
            {formatPercent(annualizedVolatility)}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            Annualisée (CAC 40 référence : ~16-18%)
          </p>
        </div>

        {/* Max Drawdown */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Max Drawdown</span>
            <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <p className="text-xl font-bold text-rose-400">
            -{formatPercent(maxDrawdown.maxDrawdownPct)}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            Pire baisse historique : -{formatEUR(maxDrawdown.maxDrawdownAmount)}
          </p>
        </div>

        {/* Top Holding Weight */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Poids 1ère ligne</span>
            <PieChart className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <p
            className={`text-xl font-bold ${
              diversification.topHoldingWeight > 20
                ? "text-amber-400"
                : "text-white"
            }`}
          >
            {diversification.topHoldingWeight.toFixed(1)}%
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            Secteur n°1 : {diversification.topSectorWeight.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Recommendations Box */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
          <Info className="h-4 w-4 text-violet-400" />
          <span>Diagnostic & Recommandations d&apos;Allocation</span>
        </div>
        <ul className="space-y-1.5">
          {diversification.recommendations.map((rec, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-zinc-300"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
