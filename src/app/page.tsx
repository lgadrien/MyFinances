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
import {
  Wallet,
  TrendingUp,
  Banknote,
  PiggyBank,
  Target,
  Coins,
  CalendarDays,
  Settings2,
  Save,
} from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import {
  fetchTransactions,
  fetchStockPrice,
  fetchSettings,
  updateSettings,
} from "@/lib/data";
import {
  calculateTotalInvested,
  calculateDividends,
  calculatePortfolioPositions,
  groupDividendsByMonth,
  type PortfolioPosition,
} from "@/lib/calculations";
import { FRENCH_INSTRUMENTS } from "@/lib/french-instruments";
import toast from "react-hot-toast";

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
  const [savingSettings, setSavingSettings] = useState(false);

  // Nouvelles features via DB
  const [cashBalance, setCashBalance] = useState(0);
  const [targetCapital, setTargetCapital] = useState(10000);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [projectedDividends, setProjectedDividends] = useState<
    { month: string; amount: number }[]
  >([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Fetch DB Settings
      const settings = await fetchSettings();
      if (settings) {
        setCashBalance(settings.cash_balance);
        setTargetCapital(settings.target_capital);
      }

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

      // Calcul des projections de dividendes
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const lastYearDivs = transactions.filter(
        (t) => t.type === "Dividende" && new Date(t.date) >= oneYearAgo,
      );

      const projectedMap = new Map<string, number>();
      for (const d of lastYearDivs) {
        const position = enriched.find((p) => p.ticker === d.ticker);
        if (position && position.totalQuantity > 0) {
          const dDate = new Date(d.date);
          dDate.setFullYear(dDate.getFullYear() + 1);
          const projectedMonth = dDate.toISOString().substring(0, 7);
          projectedMap.set(
            projectedMonth,
            (projectedMap.get(projectedMonth) || 0) + d.total_amount,
          );
        }
      }

      const sortedProjections = Array.from(projectedMap.entries())
        .filter(([month]) => month >= new Date().toISOString().substring(0, 7))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount }))
        .slice(0, 4);

      setProjectedDividends(sortedProjections);
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
      {/* Header & Settings Toggle */}
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
          className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Configuration</span>
        </button>
      </div>

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6 backdrop-blur-sm animate-in slide-in-from-top-4">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white">Paramètres</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Liquidités non investies (Cash) €
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={cashBalance}
                  onChange={(e) =>
                    setCashBalance(parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Objectif de Capital Total €
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={targetCapital}
                  onChange={(e) =>
                    setTargetCapital(parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              disabled={savingSettings}
              onClick={async () => {
                setSavingSettings(true);
                const ok = await updateSettings(cashBalance, targetCapital);
                if (ok) {
                  toast.success("Paramètres synchronisés !");
                  setIsSettingsOpen(false);
                } else {
                  toast.error("Erreur de synchronisation.");
                }
                setSavingSettings(false);
              }}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
            >
              <Save
                className={`h-4 w-4 ${savingSettings ? "animate-pulse" : ""}`}
              />
              {savingSettings ? "Chargement..." : "Sauvegarder"}
            </button>
          </div>
        </div>
      )}

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
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-400">
              Capital Total (Inclus Cash)
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-white">
            {formatEUR(totalCapital + cashBalance)}
          </p>
          {/* Progress Bar for Goal */}
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-zinc-500">
              <span>Objectif : {formatEUR(targetCapital)}</span>
              <span className="font-medium text-violet-400">
                {Math.min(
                  ((totalCapital + cashBalance) / (targetCapital || 1)) * 100,
                  100,
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-violet-500 transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(((totalCapital + cashBalance) / (targetCapital || 1)) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
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

      {/* Dividend Projections & Cash Allocation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-violet-400" />
              <h2 className="text-lg font-bold text-white">
                Prévisions Dividendes
              </h2>
            </div>
            <span className="text-xs text-zinc-500">Basé sur annèe N-1</span>
          </div>
          {projectedDividends.length > 0 ? (
            <div className="space-y-3">
              {projectedDividends.map((pd) => (
                <div
                  key={pd.month}
                  className="flex justify-between border-b border-zinc-800/50 pb-2"
                >
                  <span className="text-sm font-medium text-zinc-300 capitalize">
                    {new Date(pd.month + "-01").toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="font-bold text-emerald-400">
                    +{formatEUR(pd.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Aucune projection à venir pour vos actions actuelles.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black p-6 backdrop-blur-sm shadow-[0_0_15px_rgba(139,92,246,0.1)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-fuchsia-400" />
              <h2 className="text-lg font-bold text-white">
                Capital et Liquidités
              </h2>
            </div>
            <span className="text-xs text-zinc-500">PEA</span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Actions (Investi + PV)</span>
              <span className="font-semibold text-white">
                {formatEUR(totalCapital)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Poche Espèces (Cash)</span>
              <span className="font-semibold text-white">
                {formatEUR(cashBalance)}
              </span>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-3">
              <span className="font-bold text-zinc-300">TOTAL PEA</span>
              <span className="font-bold text-violet-400">
                {formatEUR(totalCapital + cashBalance)}
              </span>
            </div>
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
