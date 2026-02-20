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
  "#8b5cf6", // Violet
  "#d946ef", // Fuchsia
  "#6366f1", // Indigo
  "#a855f7", // Purple
  "#fafafa", // White
  "#71717a", // Zinc 500
  "#3f3f46", // Zinc 700
];

interface CustomLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

const renderCustomizedLabel = ({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
}: CustomLabelProps) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="11"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

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

  const totalDonutValue = positions.reduce(
    (sum, p) => sum + Math.round(p.capitalValue || 0),
    0,
  );
  const donutData = positions
    .filter((p) => p.capitalValue && p.capitalValue > 0)
    .map((p) => ({
      name: p.name,
      value: Math.round(p.capitalValue || 0),
      percent:
        totalDonutValue > 0
          ? Math.round(p.capitalValue || 0) / totalDonutValue
          : 0,
    }));

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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
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
        <p className="mt-1 text-sm text-zinc-400">
          Vue d&apos;ensemble de votre portefeuille PEA
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Total Investi"
          value={formatEUR(totalInvested)}
          icon={Wallet}
          accentColor="violet"
        />
        <StatsCard
          label="Dividendes Cumulés"
          value={formatEUR(totalDividends)}
          icon={Banknote}
          accentColor="fuchsia"
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
          accentColor={totalPlusValue >= 0 ? "emerald" : "amber"} // Keep semantic colors for P&L
        />
        <StatsCard
          label="Capital Total"
          value={formatEUR(totalCapital)}
          icon={PiggyBank}
          accentColor="violet"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Donut Chart — Capital Repartition */}
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black p-6 backdrop-blur-sm">
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
                  labelLine={false}
                  label={renderCustomizedLabel}
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
                  formatter={(value, name, props) => {
                    const percent = props?.payload?.percent;
                    if (percent !== undefined) {
                      return [
                        `${formatEUR(Number(value ?? 0))} (${(percent * 100).toFixed(1)}%)`,
                        name,
                      ];
                    }
                    return [formatEUR(Number(value ?? 0)), name];
                  }}
                  contentStyle={{
                    backgroundColor: "#09090b",
                    border: "1px solid #27272a",
                    borderRadius: "12px",
                    fontSize: "13px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  }}
                  itemStyle={{ color: "#fafafa" }}
                  labelStyle={{ color: "#a1a1aa" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => (
                    <span className="text-xs text-zinc-300">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart — Dividend History */}
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-bold text-white">
            Historique des Dividendes
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dividendHistory}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}€`}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value ?? 0).toFixed(2)} €`,
                    "Dividendes",
                  ]}
                  contentStyle={{
                    backgroundColor: "#09090b",
                    border: "1px solid #27272a",
                    borderRadius: "12px",
                    fontSize: "13px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  }}
                  itemStyle={{ color: "#fafafa" }}
                  labelStyle={{ color: "#a1a1aa" }}
                  cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
                />
                <Bar
                  dataKey="amount"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Portfolio Positions Table */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-lg font-bold text-white">
          Positions du Portefeuille
        </h2>
        <div className="overflow-x-auto">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {positions.map((pos) => (
                <tr
                  key={pos.ticker}
                  className="transition-colors hover:bg-zinc-900/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-white">{pos.name}</p>
                      <p className="text-xs text-zinc-500">{pos.ticker}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-200">
                    {pos.totalQuantity}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-200">
                    {formatPrice(pos.pru)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-200">
                    {pos.currentPrice ? formatPrice(pos.currentPrice) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-200">
                    {formatEUR(pos.totalInvested)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-200">
                    {formatEUR(pos.capitalValue || 0)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      (pos.plusValue || 0) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
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
