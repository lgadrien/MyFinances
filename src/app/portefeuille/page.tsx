"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { format, subDays, subMonths, subYears, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { fetchTransactions, fetchStockPrice } from "@/lib/data";
import {
  calculatePortfolioPositions,
  type PortfolioPosition,
} from "@/lib/calculations";
import { FRENCH_INSTRUMENTS } from "@/lib/french-instruments";
import Badge from "@/components/ui/Badge";

const COLORS = [
  "#8b5cf6", // Violet
  "#d946ef", // Fuchsia
  "#6366f1", // Indigo
  "#a855f7", // Purple
  "#fafafa", // White
  "#71717a", // Zinc 500
  "#3f3f46", // Zinc 700
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
        <p className="mb-2 text-sm font-medium text-zinc-400">
          {label ? format(parseISO(label), "d MMMM yyyy", { locale: fr }) : ""}
        </p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            className="text-sm font-semibold"
            style={{ color: entry.color }}
          >
            {entry.name}:{" "}
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-xl">
        <p className="font-medium text-white">{payload[0].name}</p>
        <p className="text-sm text-zinc-300">
          {new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
          }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function PortfolioPage() {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [history, setHistory] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<"1W" | "1M" | "1Y" | "Max">("1M");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Map for instrument lookup
  const instrumentMap = useMemo(() => {
    const map = new Map<string, { name: string; sector: string }>();
    FRENCH_INSTRUMENTS.forEach((i) => {
      map.set(i.ticker, { name: i.name, sector: i.sector });
    });
    return map;
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const txs = await fetchTransactions();
      const initialPositions = calculatePortfolioPositions(txs, instrumentMap);

      // Fetch history
      const historyRes = await fetch("/api/portfolio/history");
      const historyData = await historyRes.json();
      setHistory(Array.isArray(historyData) ? historyData : []);

      // Filter only active positions
      const activePositions = initialPositions.filter(
        (p) => p.totalQuantity > 0.0001,
      );

      // Fetch live prices
      const enrichedPositions = await Promise.all(
        activePositions.map(async (pos) => {
          const priceData = await fetchStockPrice(pos.ticker);
          const currentPrice = priceData?.price || 0;
          const capitalValue = currentPrice * pos.totalQuantity;
          const plusValue = capitalValue - pos.totalInvested;

          return {
            ...pos,
            currentPrice,
            capitalValue,
            plusValue,
          };
        }),
      );

      setPositions(enrichedPositions);
    } catch (error) {
      console.error("Failed to load portfolio:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!history.length) {
      setFilteredHistory([]);
      return;
    }

    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let filtered: any[] = [...history];

    if (timeRange === "1W") {
      const limit = subDays(now, 7);
      filtered = history.filter((d) => parseISO(d.date) >= limit);
    } else if (timeRange === "1M") {
      const limit = subMonths(now, 1);
      filtered = history.filter((d) => parseISO(d.date) >= limit);
    } else if (timeRange === "1Y") {
      const limit = subYears(now, 1);
      filtered = history.filter((d) => parseISO(d.date) >= limit);
    }

    setFilteredHistory(filtered);
  }, [history, timeRange]);

  // Calculate Chart Data
  const sectorData = useMemo(() => {
    const sectors: Record<string, number> = {};
    positions.forEach((p) => {
      const sector = p.sector || "Autre";
      sectors[sector] = (sectors[sector] || 0) + (p.capitalValue || 0);
    });
    return Object.entries(sectors)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [positions]);

  const assetData = useMemo(() => {
    return positions
      .map((p) => ({ name: p.name, value: p.capitalValue || 0 }))
      .sort((a, b) => b.value - a.value);
  }, [positions]);

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

  const formatPercent = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  // Totals
  const totalInvested = positions.reduce((sum, p) => sum + p.totalInvested, 0);
  const totalValue = positions.reduce(
    (sum, p) => sum + (p.capitalValue || 0),
    0,
  );
  const totalPV = totalValue - totalInvested;
  const totalPerformance = totalInvested > 0 ? totalPV / totalInvested : 0;

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
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
          <p className="text-sm font-medium text-zinc-400">Valeur Totale</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {loading ? "..." : formatEUR(totalValue)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
          <p className="text-sm font-medium text-zinc-400">Investissement</p>
          <p className="mt-2 text-3xl font-bold text-zinc-200">
            {loading ? "..." : formatEUR(totalInvested)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
          <p className="text-sm font-medium text-zinc-400">Plus/Moins-Value</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p
              className={`text-3xl font-bold ${
                totalPV >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {loading ? "..." : (totalPV > 0 ? "+" : "") + formatEUR(totalPV)}
            </p>
            <span
              className={`text-sm font-medium ${
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
          {filteredHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredHistory}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(str) => format(parseISO(str), "dd/MM")}
                  stroke="#52525b"
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis
                  stroke="#52525b"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
                  domain={["auto", "auto"]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total_value"
                  name="Valeur Totale"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
                <Area
                  type="monotone"
                  dataKey="total_invested"
                  name="Investi"
                  stroke="#52525b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Aucun historique disponible. Cliquez sur &quot;Capturer
              valeur&quot; pour commencer.
            </div>
          )}
        </div>
      </div>

      {/* Allocation Charts */}
      {!loading && positions.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Sector Allocation */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Répartition Sectorielle
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sectorData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="rgba(0,0,0,0.1)"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Asset Allocation */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Répartition par Actif
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {assetData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="rgba(0,0,0,0.1)"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

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
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="max-w-[150px] truncate font-bold text-white">
                        {pos.name}
                      </p>
                      <p className="text-xs text-zinc-500">{pos.ticker}</p>
                    </div>
                    <Badge variant={isPositive ? "success" : "danger"}>
                      {isPositive ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {formatPercent(perf)}
                    </Badge>
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
                        className={`font-semibold ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
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
                      className="group transition-colors hover:bg-zinc-900/50"
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
                      <td className="px-6 py-4 text-right font-medium text-zinc-200">
                        {pos.totalQuantity.toFixed(4).replace(/\.?0+$/, "")}
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-400">
                        {formatEUR(pos.pru)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-white">
                        {pos.currentPrice ? formatEUR(pos.currentPrice) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-400">
                        {formatEUR(pos.totalInvested)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-white">
                        {pos.capitalValue ? formatEUR(pos.capitalValue) : "—"}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-medium ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {pos.plusValue
                          ? `${isPositive ? "+" : ""}${formatEUR(pos.plusValue)}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant={isPositive ? "success" : "danger"}>
                          {isPositive ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {formatPercent(perf)}
                        </Badge>
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
