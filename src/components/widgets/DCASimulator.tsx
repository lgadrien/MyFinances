"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  Sparkles,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { calculateDCASimulation } from "@/lib/dca-calculator";
import { formatEUR } from "@/lib/utils";

interface DCASimulatorProps {
  currentPortfolioValue?: number;
}

export default function DCASimulator({
  currentPortfolioValue = 5000,
}: DCASimulatorProps) {
  const [initialCapital, setInitialCapital] = useState<number>(
    Math.round(currentPortfolioValue),
  );
  const [monthlyContribution, setMonthlyContribution] = useState<number>(300);
  const [years, setYears] = useState<number>(10);
  const [annualReturn, setAnnualReturn] = useState<number>(7); // 7%

  const simulation = useMemo(() => {
    return calculateDCASimulation({
      initialCapital,
      monthlyContribution,
      years,
      annualGrowthRate: annualReturn / 100,
      dividendYieldRate: 0.02, // 2% dividend
    });
  }, [initialCapital, monthlyContribution, years, annualReturn]);

  const { finalValue, totalContributed, totalGains, monthlyData, milestones } =
    simulation;

  const multiplier =
    totalContributed > 0 ? (finalValue / totalContributed).toFixed(1) : "1.0";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-black p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(139,92,246,0.06)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Simulateur DCA & Intérêts Composés
            </h2>
            <p className="text-xs text-zinc-400">
              Projetez votre liberté financière avec l&apos;effet boule de neige
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-violet-500/10 border border-violet-500/20 px-3.5 py-1.5 text-xs font-semibold text-violet-300">
          <TrendingUp className="h-4 w-4 text-violet-400" />
          <span>Multiplicateur : x{multiplier}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-violet-500/30 bg-violet-600/10 p-4">
          <span className="text-xs font-semibold text-violet-300">
            Capital Final Estimé (à {years} ans)
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {formatEUR(finalValue)}
          </p>
          <p className="text-[10px] text-violet-400 mt-1">
            Avec réinvestissement des dividendes
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <span className="text-xs font-medium text-zinc-400">
            Total de vos Versements
          </span>
          <p className="text-xl sm:text-2xl font-bold text-zinc-200 mt-1">
            {formatEUR(totalContributed)}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            {formatEUR(initialCapital)} initial + {formatEUR(monthlyContribution)}/mois
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <span className="text-xs font-medium text-emerald-400">
            Gains Générés (Intérêts Composés)
          </span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
            +{formatEUR(totalGains)}
          </p>
          <p className="text-[10px] text-emerald-500 mt-1">
            Soit +{totalContributed > 0 ? ((totalGains / totalContributed) * 100).toFixed(0) : 0}% de profit brut
          </p>
        </div>
      </div>

      {/* Interactive Controls & Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          {/* Monthly Contribution */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1.5">
              <span>Épargne Mensuelle (DCA)</span>
              <span className="text-violet-400 font-bold">{formatEUR(monthlyContribution)} / mois</span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
          </div>

          {/* Horizon in Years */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1.5">
              <span>Horizon d&apos;investissement</span>
              <span className="text-violet-400 font-bold">{years} ans</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
          </div>

          {/* Expected Annual Return */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1.5">
              <span>Rendement Annuel Espéré</span>
              <span className="text-emerald-400 font-bold">{annualReturn}% / an</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { label: "Prudent (5%)", val: 5 },
                { label: "Moyen (7%)", val: 7 },
                { label: "Dynamique (9%)", val: 9 },
              ].map((lvl) => (
                <button
                  key={lvl.val}
                  type="button"
                  onClick={() => setAnnualReturn(lvl.val)}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    annualReturn === lvl.val
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Initial Capital Input */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Capital Initial au départ (€)
            </label>
            <input
              type="number"
              min="0"
              value={initialCapital}
              onChange={(e) => setInitialCapital(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Projection Chart */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span className="font-semibold text-zinc-200">Courbe de Croissance Patrimoniale</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-zinc-500" />
                Versements
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                Capital Composé
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorContributed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="year"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `${v}a`}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-xs shadow-xl">
                          <p className="font-semibold text-zinc-300">Année {d.year}</p>
                          <p className="text-violet-400 font-bold mt-1">
                            Valeur : {formatEUR(d.value)}
                          </p>
                          <p className="text-zinc-400">
                            Versé : {formatEUR(d.contributed)}
                          </p>
                          <p className="text-emerald-400">
                            Gain : +{formatEUR(Math.max(0, d.value - d.contributed))}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="contributed"
                  stroke="#71717a"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorContributed)"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Milestones Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="border-b border-zinc-800 text-[10px] uppercase text-zinc-400">
            <tr>
              <th className="py-2">Étape</th>
              <th className="py-2 text-right">Total Versé</th>
              <th className="py-2 text-right">Gains Composés</th>
              <th className="py-2 text-right">Valeur Patrimoniale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {milestones
              .filter((m) => m.year > 0 && (m.year % 5 === 0 || m.year === years))
              .map((m) => (
                <tr key={m.year}>
                  <td className="py-2.5 font-semibold text-white flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-violet-400" />
                    <span>{m.year} ans</span>
                  </td>
                  <td className="py-2.5 text-right text-zinc-400">
                    {formatEUR(m.totalContributed)}
                  </td>
                  <td className="py-2.5 text-right text-emerald-400 font-semibold">
                    +{formatEUR(m.totalGains)}
                  </td>
                  <td className="py-2.5 text-right font-extrabold text-white">
                    {formatEUR(m.totalValue)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
