"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { fetchTransactions, fetchStockPrice } from "@/lib/data";
import {
  calculatePortfolioPositions,
  type PortfolioPosition,
} from "@/lib/calculations";
import { FRENCH_INSTRUMENTS } from "@/lib/french-instruments";
import Badge from "@/components/ui/Badge";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-2 shadow-xl">
        <p className="font-medium text-white">{payload[0].name}</p>
        <p className="text-sm text-slate-300">
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
    }).format(n);

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
          <p className="mt-1 text-sm text-slate-400">
            Vue détaillée de vos positions et de leur performance
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Actualiser
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6 backdrop-blur">
          <p className="text-sm font-medium text-slate-400">Valeur Totale</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {loading ? "..." : formatEUR(totalValue)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6 backdrop-blur">
          <p className="text-sm font-medium text-slate-400">Investissement</p>
          <p className="mt-2 text-3xl font-bold text-slate-200">
            {loading ? "..." : formatEUR(totalInvested)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6 backdrop-blur">
          <p className="text-sm font-medium text-slate-400">Plus/Moins-Value</p>
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

      {/* Charts Section */}
      {!loading && positions.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Sector Allocation */}
          <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6 backdrop-blur">
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Asset Allocation */}
          <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6 backdrop-blur">
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Positions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/50 to-slate-800/20 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              <th className="px-6 py-4 text-left font-semibold text-slate-400">
                Actif
              </th>
              <th className="px-6 py-4 text-right font-semibold text-slate-400">
                Qté
              </th>
              <th className="px-6 py-4 text-right font-semibold text-slate-400">
                PRU
              </th>
              <th className="px-6 py-4 text-right font-semibold text-slate-400">
                Prix Actuel
              </th>
              <th className="px-6 py-4 text-right font-semibold text-slate-400">
                Investi
              </th>
              <th className="px-6 py-4 text-right font-semibold text-slate-400">
                Valeur
              </th>
              <th className="px-6 py-4 text-right font-semibold text-slate-400">
                +/- Value
              </th>
              <th className="px-6 py-4 text-right font-semibold text-slate-400">
                Perf.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="px-6 py-6">
                    <div className="h-5 w-full animate-pulse rounded bg-slate-800" />
                  </td>
                </tr>
              ))
            ) : positions.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-slate-500"
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
                    className="group transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4">
                      <div
                        className="font-bold text-white max-w-[150px] truncate"
                        title={pos.name}
                      >
                        {pos.name}
                      </div>
                      <div className="text-xs text-slate-500">{pos.ticker}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-200">
                      {pos.totalQuantity.toFixed(4).replace(/\.?0+$/, "")}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400">
                      {formatEUR(pos.pru)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-white">
                      {pos.currentPrice ? formatEUR(pos.currentPrice) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400">
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
  );
}
