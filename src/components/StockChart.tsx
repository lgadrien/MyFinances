"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Loader2, X, TrendingUp, TrendingDown, Activity } from "lucide-react";
import {
  computeTrendScore,
  rsi,
  macd,
  sma,
  bollingerBands,
  SIGNAL_CONFIG,
  signalToFR,
  type OHLCV,
  type TrendSignal,
} from "@/lib/technical-analysis";

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

type ActiveTab = "chart" | "indicators";

// ── Gauge RSI component ──────────────────────────────────────────────────────
function RSIGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = clamped < 30 ? "#10b981" : clamped > 70 ? "#ef4444" : "#a1a1aa";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 100 60" className="w-full">
          {/* Background arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#27272a"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(clamped / 100) * 125.6} 125.6`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
          {/* Threshold lines */}
          <line
            x1="26"
            y1="44"
            x2="22"
            y2="38"
            stroke="#10b981"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <line
            x1="74"
            y1="44"
            x2="78"
            y2="38"
            stroke="#ef4444"
            strokeWidth="1.5"
            opacity="0.5"
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-lg font-bold" style={{ color }}>
            {clamped.toFixed(0)}
          </span>
        </div>
      </div>
      <div className="flex w-full justify-between text-[9px] text-zinc-600">
        <span>Survente</span>
        <span>Surachat</span>
      </div>
    </div>
  );
}

// ── Mini signal badge ─────────────────────────────────────────────────────────
function SignalBadge({ signal }: { signal: TrendSignal | null }) {
  if (!signal) return <span className="text-xs text-zinc-600">—</span>;
  const cfg = SIGNAL_CONFIG[signal];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${cfg.bgColor} ${cfg.color}`}
    >
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  // score entre -4 et +4 → 0-100%
  const pct = ((score + 4) / 8) * 100;
  const color =
    score >= 2
      ? "#10b981"
      : score >= 0
        ? "#a1a1aa"
        : score >= -2
          ? "#f59e0b"
          : "#ef4444";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <span>Baissier</span>
        <span>
          Score : {score > 0 ? "+" : ""}
          {score}/4
        </span>
        <span>Haussier</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        {/* Centre marker */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-600" />
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.abs(score) * 12.5}%`,
            marginLeft: score >= 0 ? "50%" : `${50 - Math.abs(score) * 12.5}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

export default function StockChart({ ticker, name, onClose }: StockChartProps) {
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInterval, setActiveInterval] = useState("daily");
  const [crosshairData, setCrosshairData] = useState<HistoryPoint | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("chart");

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

  // ── Price Stats ──────────────────────────────────────────────────────────
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

  // ── Technical indicators ─────────────────────────────────────────────────
  const trendScore = useMemo(() => {
    if (data.length < 10) return null;
    return computeTrendScore(data as OHLCV[]);
  }, [data]);

  const closes = useMemo(() => data.map((d) => d.close), [data]);

  // Enrich chart data with SMA20 + RSI
  const enrichedData = useMemo(() => {
    if (!closes.length) return [];
    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);
    const rsiSeries = rsi(closes);
    const bbSeries = bollingerBands(closes);
    const macdSeries = macd(closes);

    return data.map((d, i) => ({
      ...d,
      sma20: sma20[i],
      sma50: sma50[i],
      rsi: rsiSeries[i],
      bbUpper: bbSeries[i].upper,
      bbLower: bbSeries[i].lower,
      macd: macdSeries[i].macd,
      macdSignal: macdSeries[i].signal,
      macdHistogram: macdSeries[i].histogram,
    }));
  }, [data, closes]);

  const gradientColor = isPositive ? "#10b981" : "#ef4444";
  const gradientId = `chart-gradient-${ticker.replace(/[^a-zA-Z]/g, "")}`;

  function formatDateLabel(dateStr: string) {
    if (dateStr.includes(" ")) {
      return dateStr.split(" ")[1] || dateStr;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }

  const signalCfg = trendScore ? SIGNAL_CONFIG[trendScore.signal] : null;

  return (
    <div className="animate-in slide-in-from-top-2 overflow-hidden rounded-2xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/80 shadow-2xl shadow-black/30">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 px-6 py-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{name}</h3>
              <span className="rounded-md bg-zinc-700/50 px-2 py-0.5 text-xs font-medium text-zinc-400">
                {ticker}
              </span>
              {signalCfg && (
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold ${signalCfg.bgColor} ${signalCfg.color}`}
                >
                  {signalCfg.emoji} {signalCfg.label}
                </span>
              )}
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
          aria-label="Fermer le graphique"
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-zinc-800/30 px-6 py-2">
        <button
          onClick={() => setActiveTab("chart")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "chart"
              ? "bg-zinc-700/60 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Graphique
        </button>
        <button
          onClick={() => setActiveTab("indicators")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "indicators"
              ? "bg-violet-500/15 text-violet-400"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Activity className="h-3 w-3" />
          Analyse technique
        </button>

        {/* Spacer + Period selector (chart tab only) */}
        {activeTab === "chart" && (
          <div className="ml-auto flex items-center gap-1">
            {TIME_PERIODS.map((period) => (
              <button
                key={period.interval}
                onClick={() => handlePeriodChange(period.interval)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeInterval === period.interval
                    ? isPositive
                      ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                      : "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                    : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
                }`}
                title={period.description}
              >
                {period.label}
              </button>
            ))}
          </div>
        )}

        {/* OHLC info on hover */}
        {activeTab === "chart" && crosshairData && (
          <div className="ml-3 flex gap-3 text-xs text-zinc-500">
            <span>
              O{" "}
              <span className="font-medium text-zinc-300">
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
              <span className="font-medium text-zinc-200">
                {crosshairData.close.toFixed(2)}
              </span>
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
          Aucune donnée disponible
        </div>
      ) : activeTab === "chart" ? (
        <>
          {/* ── Area chart ── */}
          <div className="px-4 py-4" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={enrichedData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
                    return new Date(s).toLocaleDateString("fr-FR", {
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
                {/* SMA 20 */}
                <Area
                  type="monotone"
                  dataKey="sma20"
                  stroke="#8b5cf6"
                  strokeWidth={1.5}
                  fill="none"
                  dot={false}
                  name="SMA 20"
                  strokeDasharray="4 2"
                />
                {/* SMA 50 */}
                <Area
                  type="monotone"
                  dataKey="sma50"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  fill="none"
                  dot={false}
                  name="SMA 50"
                  strokeDasharray="6 3"
                />
                {/* Bollinger bands */}
                <Area
                  type="monotone"
                  dataKey="bbUpper"
                  stroke="#6366f1"
                  strokeWidth={1}
                  fill="none"
                  dot={false}
                  strokeDasharray="2 2"
                  strokeOpacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="bbLower"
                  stroke="#6366f1"
                  strokeWidth={1}
                  fill="none"
                  dot={false}
                  strokeDasharray="2 2"
                  strokeOpacity={0.5}
                />
                {/* Price */}
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
          </div>

          {/* Légende */}
          <div className="flex flex-wrap items-center gap-4 border-t border-zinc-800/30 px-6 py-2 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-px w-5 border-b border-dashed border-violet-500" />{" "}
              SMA 20
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-px w-5 border-b border-dashed border-amber-500" />{" "}
              SMA 50
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-px w-5 border-b border-dashed border-indigo-400 opacity-60" />{" "}
              Bollinger
            </span>
          </div>

          {/* Stats row */}
          <div className="border-t border-zinc-800/30 px-6 py-3">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>
                Min:{" "}
                <span className="font-medium text-red-400">
                  {minPrice.toFixed(2)} €
                </span>
              </span>
              <span>
                Moy:{" "}
                <span className="font-medium text-zinc-300">
                  {avgPrice.toFixed(2)} €
                </span>
              </span>
              <span>
                Max:{" "}
                <span className="font-medium text-emerald-400">
                  {maxPrice.toFixed(2)} €
                </span>
              </span>
              <span className="text-zinc-600">
                {data.length} points ·{" "}
                {TIME_PERIODS.find((p) => p.interval === activeInterval)
                  ?.description || activeInterval}
              </span>
            </div>
          </div>
        </>
      ) : (
        /* ── ONGLET ANALYSE TECHNIQUE ── */
        <div className="space-y-0 divide-y divide-zinc-800/50">
          {trendScore ? (
            <>
              {/* Signal global */}
              <div className="px-6 py-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-300">
                    Signal global
                  </span>
                  <span className="text-xs text-zinc-500">
                    Confiance : {trendScore.confidence}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-2xl font-extrabold ${signalCfg?.color}`}
                  >
                    {signalCfg?.emoji} {signalCfg?.label}
                  </span>
                </div>
                <div className="mt-3">
                  <ScoreBar score={trendScore.score} />
                </div>
              </div>

              {/* Indicateurs individuels */}
              <div className="grid grid-cols-2 gap-px bg-zinc-800/30 sm:grid-cols-5">
                {[
                  { label: "RSI", signal: trendScore.details.rsiSignal },
                  { label: "MACD", signal: trendScore.details.macdSignal },
                  {
                    label: "Bollinger",
                    signal: trendScore.details.bollingerSignal,
                  },
                  { label: "Moyennes", signal: trendScore.details.maSignal },
                  {
                    label: "Momentum",
                    signal: trendScore.details.momentumSignal,
                  },
                ].map(({ label, signal }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-2 bg-zinc-900/50 px-3 py-4"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      {label}
                    </span>
                    <SignalBadge signal={signal} />
                  </div>
                ))}
              </div>

              {/* Valeurs brutes */}
              <div className="px-6 py-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Valeurs des indicateurs
                </p>

                {/* RSI Gauge */}
                {trendScore.indicators.rsi !== null && (
                  <div className="mb-4 flex items-center gap-6">
                    <RSIGauge value={trendScore.indicators.rsi} />
                    <div className="space-y-1.5 text-xs text-zinc-400">
                      <p>
                        RSI{" "}
                        <span className="font-bold text-white">
                          {trendScore.indicators.rsi}
                        </span>
                      </p>
                      <p className="text-zinc-600">
                        {"<"}30 = survente (achat) · {">"}70 = surachat (vente)
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    {
                      label: "MACD",
                      value: trendScore.indicators.macd,
                      suffix: "",
                    },
                    {
                      label: "Histogramme MACD",
                      value: trendScore.indicators.macdHistogram,
                      suffix: "",
                    },
                    {
                      label: "SMA 20",
                      value: trendScore.indicators.sma20,
                      suffix: " €",
                    },
                    {
                      label: "SMA 50",
                      value: trendScore.indicators.sma50,
                      suffix: " €",
                    },
                    {
                      label: "Bollinger %B",
                      value:
                        trendScore.indicators.bollingerPercentB !== null
                          ? (
                              trendScore.indicators.bollingerPercentB * 100
                            ).toFixed(0)
                          : null,
                      suffix: "%",
                    },
                    {
                      label: "ATR (volatilité)",
                      value: trendScore.indicators.atrPercent,
                      suffix: "%",
                    },
                  ].map(({ label, value, suffix }) => (
                    <div
                      key={label}
                      className="flex justify-between rounded-lg bg-zinc-800/40 px-3 py-2"
                    >
                      <span className="text-zinc-500">{label}</span>
                      <span className="font-semibold text-zinc-200">
                        {value !== null ? `${value}${suffix}` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RSI chart */}
              {enrichedData.some((d) => d.rsi !== null) && (
                <div className="px-4 py-4">
                  <p className="mb-2 px-2 text-xs font-semibold text-zinc-500">
                    RSI (14)
                  </p>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={enrichedData}
                        margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDateLabel}
                          tick={{ fill: "#475569", fontSize: 9 }}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                          minTickGap={60}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: "#475569", fontSize: 9 }}
                          tickLine={false}
                          axisLine={false}
                          width={25}
                        />
                        <ReferenceLine
                          y={70}
                          stroke="#ef4444"
                          strokeDasharray="4 2"
                          strokeOpacity={0.6}
                        />
                        <ReferenceLine
                          y={30}
                          stroke="#10b981"
                          strokeDasharray="4 2"
                          strokeOpacity={0.6}
                        />
                        <ReferenceLine
                          y={50}
                          stroke="#475569"
                          strokeDasharray="2 4"
                          strokeOpacity={0.4}
                        />
                        <Line
                          type="monotone"
                          dataKey="rsi"
                          stroke="#a855f7"
                          strokeWidth={2}
                          dot={false}
                          name="RSI"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* MACD chart */}
              {enrichedData.some((d) => d.macd !== null) && (
                <div className="px-4 py-4">
                  <p className="mb-2 px-2 text-xs font-semibold text-zinc-500">
                    MACD (12/26/9)
                  </p>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={enrichedData}
                        margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDateLabel}
                          tick={{ fill: "#475569", fontSize: 9 }}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                          minTickGap={60}
                        />
                        <YAxis
                          tick={{ fill: "#475569", fontSize: 9 }}
                          tickLine={false}
                          axisLine={false}
                          width={35}
                        />
                        <ReferenceLine y={0} stroke="#52525b" />
                        <Bar
                          dataKey="macdHistogram"
                          name="Histogramme"
                          radius={[2, 2, 0, 0]}
                        >
                          {enrichedData.map((entry, index) => (
                            <Cell
                              key={`macd-cell-${index}`}
                              fill={
                                (entry.macdHistogram ?? 0) >= 0
                                  ? "#10b981"
                                  : "#ef4444"
                              }
                              fillOpacity={0.75}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="px-6 py-3 text-[10px] text-zinc-600">
                ⚠️ Analyse technique fournie à titre indicatif uniquement. Ne
                constitue pas un conseil en investissement.
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
              Données insuffisantes pour l&apos;analyse (minimum 10 points
              requis)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
