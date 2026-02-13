"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Loader2, X, TrendingUp, TrendingDown } from "lucide-react";

interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  ticker: string;
  name: string;
  onClose: () => void;
}

const TIME_PERIODS = [
  { label: "5M", interval: "5min", description: "5 minutes" },
  { label: "15M", interval: "15min", description: "15 minutes" },
  { label: "1H", interval: "60min", description: "1 heure" },
  { label: "1J", interval: "daily", description: "1 jour" },
  { label: "1S", interval: "weekly", description: "1 semaine" },
] as const;

export default function StockChart({ ticker, name, onClose }: StockChartProps) {
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInterval, setActiveInterval] = useState("daily");
  const [crosshairData, setCrosshairData] = useState<HistoryPoint | null>(null);

  const fetchHistory = useCallback(
    async (interval: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/stock/history?ticker=${encodeURIComponent(ticker)}&interval=${interval}`,
        );
        const json = await res.json();
        setData(json.data || []);
      } catch (err) {
        console.error("Error fetching history:", err);
        setData([]);
      }
      setLoading(false);
    },
    [ticker],
  );

  useEffect(() => {
    fetchHistory(activeInterval);
  }, [activeInterval, fetchHistory]);

  function handlePeriodChange(interval: string) {
    setActiveInterval(interval);
    setCrosshairData(null);
  }

  // Calculate stats from data
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];
  const periodChange =
    firstPoint && lastPoint ? lastPoint.close - firstPoint.close : 0;
  const periodChangePercent =
    firstPoint && firstPoint.close > 0
      ? (periodChange / firstPoint.close) * 100
      : 0;
  const isPositive = periodChange >= 0;

  const displayPoint = crosshairData || lastPoint;

  const minPrice = data.length > 0 ? Math.min(...data.map((d) => d.low)) : 0;
  const maxPrice = data.length > 0 ? Math.max(...data.map((d) => d.high)) : 0;
  const pricePadding = (maxPrice - minPrice) * 0.05 || 1;

  const avgPrice =
    data.length > 0
      ? data.reduce((sum, d) => sum + d.close, 0) / data.length
      : 0;

  // Gradient colors based on performance
  const gradientColor = isPositive ? "#10b981" : "#ef4444";
  const gradientId = `chart-gradient-${ticker.replace(/[^a-zA-Z]/g, "")}`;

  function formatDateLabel(dateStr: string) {
    if (dateStr.includes(" ")) {
      // Intraday: "2024-01-15 14:30"
      const parts = dateStr.split(" ");
      return parts[1] || dateStr;
    }
    // Daily/weekly: "2024-01-15"
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }

  return (
    <div className="animate-in slide-in-from-top-2 overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/80 shadow-2xl shadow-black/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 px-6 py-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{name}</h3>
              <span className="rounded-md bg-slate-700/50 px-2 py-0.5 text-xs font-medium text-slate-400">
                {ticker}
              </span>
            </div>
            {displayPoint && (
              <div className="mt-1 flex items-center gap-3">
                <span className="text-2xl font-extrabold text-white">
                  {displayPoint.close.toFixed(2)} €
                </span>
                <div
                  className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-sm font-semibold ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {isPositive ? "+" : ""}
                  {periodChange.toFixed(2)} ({isPositive ? "+" : ""}
                  {periodChangePercent.toFixed(2)}%)
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Time period selector */}
      <div className="flex items-center gap-1 border-b border-slate-800/30 px-6 py-3">
        {TIME_PERIODS.map((period) => (
          <button
            key={period.interval}
            onClick={() => handlePeriodChange(period.interval)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeInterval === period.interval
                ? isPositive
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                  : "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
            }`}
            title={period.description}
          >
            {period.label}
          </button>
        ))}

        {/* OHLC info on hover */}
        {crosshairData && (
          <div className="ml-auto flex gap-4 text-xs text-slate-500">
            <span>
              O{" "}
              <span className="font-medium text-slate-300">
                {crosshairData.open.toFixed(2)}
              </span>
            </span>
            <span>
              H{" "}
              <span className="font-medium text-emerald-400">
                {crosshairData.high.toFixed(2)}
              </span>
            </span>
            <span>
              L{" "}
              <span className="font-medium text-red-400">
                {crosshairData.low.toFixed(2)}
              </span>
            </span>
            <span>
              C{" "}
              <span className="font-medium text-slate-200">
                {crosshairData.close.toFixed(2)}
              </span>
            </span>
            <span>
              Vol{" "}
              <span className="font-medium text-slate-300">
                {(crosshairData.volume / 1000).toFixed(0)}K
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="px-4 py-4" style={{ height: 320 }}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Aucune donnée disponible
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onMouseMove={(state: any) => {
                if (state?.activePayload?.[0]?.payload) {
                  setCrosshairData(
                    state.activePayload[0].payload as HistoryPoint,
                  );
                }
              }}
              onMouseLeave={() => setCrosshairData(null)}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={gradientColor}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={gradientColor}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                stroke="#475569"
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#1e293b" }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                domain={[minPrice - pricePadding, maxPrice + pricePadding]}
                stroke="#475569"
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v.toFixed(0)}€`}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  padding: "12px 16px",
                }}
                labelStyle={{
                  color: "#94a3b8",
                  fontSize: "11px",
                  marginBottom: "6px",
                }}
                itemStyle={{
                  color: "#e2e8f0",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [
                  `${Number(value).toFixed(2)} €`,
                  "Clôture",
                ]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                labelFormatter={(label: any) => {
                  const s = String(label);
                  if (s.includes(" ")) return s;
                  const d = new Date(s);
                  return d.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  });
                }}
                cursor={{
                  stroke: "#475569",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />
              <ReferenceLine
                y={avgPrice}
                stroke="#475569"
                strokeDasharray="6 4"
                label={{
                  value: `Moy: ${avgPrice.toFixed(0)}€`,
                  fill: "#64748b",
                  fontSize: 10,
                  position: "right",
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={gradientColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: gradientColor,
                  stroke: "#0f172a",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Volume bar at bottom */}
      {!loading && data.length > 0 && (
        <div className="border-t border-slate-800/30 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Min:{" "}
              <span className="font-medium text-red-400">
                {minPrice.toFixed(2)} €
              </span>
            </span>
            <span>
              Moy:{" "}
              <span className="font-medium text-slate-300">
                {avgPrice.toFixed(2)} €
              </span>
            </span>
            <span>
              Max:{" "}
              <span className="font-medium text-emerald-400">
                {maxPrice.toFixed(2)} €
              </span>
            </span>
            <span className="text-slate-600">
              {data.length} points ·{" "}
              {TIME_PERIODS.find((p) => p.interval === activeInterval)
                ?.description || activeInterval}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
