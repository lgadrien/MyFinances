"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, Activity } from "lucide-react";
import {
  computeTrendScore,
  rsi,
  macd,
  sma,
  bollingerBands,
  SIGNAL_CONFIG,
  type OHLCV,
} from "@/lib/technical-analysis";
import { StockChartHeader } from "./stock-chart/StockChartHeader";
import { MainPriceChart, type HistoryPoint } from "./stock-chart/MainPriceChart";
import { TechnicalAnalysisPanel } from "./stock-chart/TechnicalAnalysisPanel";

interface StockChartProps {
  ticker: string;
  name: string;
  onClose: () => void;
}

const TIME_PERIODS = [
  { label: "1J", interval: "5min", description: "1 jour" },
  { label: "1S", interval: "15min", description: "1 semaine" },
  { label: "1M", interval: "60min", description: "1 mois" },
  { label: "3M", interval: "daily", description: "3 mois" },
  { label: "1A", interval: "weekly", description: "1 an" },
] as const;

type ActiveTab = "chart" | "indicators";

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

  // ── Price Stats ──
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

  // ── Technical indicators ──
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
  const gradientId = `colorClose-${ticker}-${activeInterval}`;

  function formatDateLabel(d: string) {
    if (activeInterval === "5min" || activeInterval === "15min") {
      return d.split(" ")[1] || d; // Juste l'heure "HH:mm"
    }
    const [year, month, day] = d.split(" ")[0].split("-");
    if (activeInterval === "weekly" || activeInterval === "monthly") {
      return `${month}/${year.slice(2)}`;
    }
    return `${day}/${month}`;
  }

  const signalCfg = trendScore ? SIGNAL_CONFIG[trendScore.signal] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <StockChartHeader
          ticker={ticker}
          name={name}
          displayPoint={displayPoint}
          isPositive={isPositive}
          periodChange={periodChange}
          periodChangePercent={periodChangePercent}
          signal={trendScore?.signal ?? null}
          onClose={onClose}
        />

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
            <div className="ml-auto flex items-center gap-1 overflow-x-auto hide-scrollbar">
              {TIME_PERIODS.map((period) => (
                <button
                  key={period.interval}
                  onClick={() => handlePeriodChange(period.interval)}
                  className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
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
            <div className="ml-3 hidden md:flex gap-3 text-xs text-zinc-500">
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

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-[300px]">
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
              <MainPriceChart
                data={enrichedData}
                minPrice={minPrice}
                maxPrice={maxPrice}
                pricePadding={pricePadding}
                avgPrice={avgPrice}
                gradientId={gradientId}
                gradientColor={gradientColor}
                formatDateLabel={formatDateLabel}
                setCrosshairData={setCrosshairData}
              />

              {/* Stats row */}
              <div className="border-t border-zinc-800/30 px-6 py-3">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    Min:{" "}
                    <span className="font-medium text-red-400">
                      {minPrice.toFixed(2)} €
                    </span>
                  </span>
                  <span className="hidden sm:inline">
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
                  <span className="text-zinc-600 hidden md:inline">
                    {data.length} points ·{" "}
                    {TIME_PERIODS.find((p) => p.interval === activeInterval)
                      ?.description || activeInterval}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <TechnicalAnalysisPanel
              trendScore={trendScore}
              enrichedData={enrichedData}
              signalCfg={signalCfg}
              formatDateLabel={formatDateLabel}
            />
          )}
        </div>
      </div>
    </div>
  );
}
