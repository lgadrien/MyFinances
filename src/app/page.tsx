"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Wallet, TrendingUp, Banknote, PiggyBank } from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import { fetchTransactions, fetchStockPrice } from "@/lib/data";
import {
  calculateTotalInvested,
  calculateDividends,
  calculatePortfolioPositions,
  groupDividendsByMonth,
  type PortfolioPosition,
} from "@/lib/calculations";
import { FRENCH_INSTRUMENTS } from "@/lib/french-instruments";

const CHART_COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export default function DashboardPage() {
  const [positions, setPositions] = useState<
    (PortfolioPosition & {
      currentPrice?: number;
      plusValue?: number;
      capitalValue?: number;
    })[]
  >([]);
  const [dividendHistory, setDividendHistory] = useState<
    { month: string; amount: number }[]
  >([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalDividends, setTotalDividends] = useState(0);
  const [totalPlusValue, setTotalPlusValue] = useState(0);
  const [totalCapital, setTotalCapital] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const transactions = await fetchTransactions();

      // Build lookup map from FRENCH_INSTRUMENTS
      const instrumentLookup = new Map(
        FRENCH_INSTRUMENTS.map((i) => [
          i.ticker,
          { name: i.name, sector: i.sector },
        ]),
      );

      const pos = calculatePortfolioPositions(transactions, instrumentLookup);

      // Fetch live prices for each position
      const pricePromises = pos.map((p) => fetchStockPrice(p.ticker));
      const prices = await Promise.all(pricePromises);

      const enriched = pos.map((p, i) => {
        const priceData = prices[i];
        const currentPrice = priceData?.price || p.pru;
        const plusValue = (currentPrice - p.pru) * p.totalQuantity;
        const capitalValue = currentPrice * p.totalQuantity;
        return { ...p, currentPrice, plusValue, capitalValue };
      });

      setPositions(enriched);
      setTotalInvested(calculateTotalInvested(transactions));
      setTotalDividends(calculateDividends(transactions));

      const pv = enriched.reduce((sum, p) => sum + (p.plusValue || 0), 0);
      setTotalPlusValue(pv);

      const cap = enriched.reduce((sum, p) => sum + (p.capitalValue || 0), 0);
      setTotalCapital(cap);

      setDividendHistory(groupDividendsByMonth(transactions));
      setLoading(false);
    }

    loadData();
  }, []);

  const donutData = positions
    .filter((p) => p.capitalValue && p.capitalValue > 0)
    .map((p) => ({
      name: p.name,
      value: Math.round(p.capitalValue || 0),
    }));

  const formatEUR = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Vue d&apos;ensemble de votre portefeuille PEA
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Total Investi"
          value={formatEUR(totalInvested)}
          icon={Wallet}
          accentColor="blue"
        />
        <StatsCard
          label="Dividendes Cumulés"
          value={formatEUR(totalDividends)}
          icon={Banknote}
          accentColor="purple"
        />
        <StatsCard
          label="Plus-Value"
          value={formatEUR(totalPlusValue)}
          icon={TrendingUp}
          trend={{
            value:
              totalInvested > 0
                ? `${((totalPlusValue / totalInvested) * 100).toFixed(1)}%`
                : "0%",
            positive: totalPlusValue >= 0,
          }}
          accentColor={totalPlusValue >= 0 ? "emerald" : "amber"}
        />
        <StatsCard
          label="Capital Total"
          value={formatEUR(totalCapital)}
          icon={PiggyBank}
          accentColor="emerald"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Donut Chart — Capital Repartition */}
        <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/50 to-slate-800/20 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-bold text-white">
            Répartition du Capital
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  dataKey="value"
                  stroke="none"
                  paddingAngle={3}
                >
                  {donutData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatEUR(Number(value ?? 0))}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid rgba(51, 65, 85, 0.6)",
                    borderRadius: "12px",
                    fontSize: "13px",
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => (
                    <span className="text-xs text-slate-300">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart — Dividend History */}
        <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/50 to-slate-800/20 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-bold text-white">
            Historique des Dividendes
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dividendHistory}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}€`}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value ?? 0).toFixed(2)} €`,
                    "Dividendes",
                  ]}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid rgba(51, 65, 85, 0.6)",
                    borderRadius: "12px",
                    fontSize: "13px",
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                  labelStyle={{ color: "#94a3b8" }}
                  cursor={{ fill: "rgba(16, 185, 129, 0.05)" }}
                />
                <Bar
                  dataKey="amount"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Portfolio Positions Table */}
      <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/50 to-slate-800/20 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-lg font-bold text-white">
          Positions du Portefeuille
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left font-semibold text-slate-400">
                  Action
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-400">
                  Qté
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-400">
                  PRU
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-400">
                  Prix Actuel
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-400">
                  Investi
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-400">
                  Valeur
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-400">
                  +/- Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {positions.map((pos) => (
                <tr
                  key={pos.ticker}
                  className="transition-colors hover:bg-slate-800/30"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-white">{pos.name}</p>
                      <p className="text-xs text-slate-500">{pos.ticker}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-200">
                    {pos.totalQuantity}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-200">
                    {pos.pru.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-200">
                    {pos.currentPrice?.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-200">
                    {formatEUR(pos.totalInvested)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-200">
                    {formatEUR(pos.capitalValue || 0)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      (pos.plusValue || 0) >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {(pos.plusValue || 0) >= 0 ? "+" : ""}
                    {formatEUR(pos.plusValue || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
