"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  useBenchmark,
  mergeBenchmarkData,
  type BenchmarkRange,
} from "@/hooks/useBenchmark";
import { Loader2 } from "lucide-react";

interface BenchmarkChartProps {
  portfolioHistory?: { date: string; total_value: number }[];
}

export default function BenchmarkChart({ portfolioHistory = [] }: BenchmarkChartProps) {
  const [benchmark, setBenchmark] = useState<"cac40" | "msciWorld">("cac40");
  const [timeRange, setTimeRange] = useState<BenchmarkRange>("1M");

  const { data, isLoading } = useBenchmark(timeRange);

  const chartData = useMemo(() => {
    if (!data) return [];
    const benchData = benchmark === "cac40" ? data.cac40 : data.msciWorld;

    if (portfolioHistory && portfolioHistory.length > 0) {
      const merged = mergeBenchmarkData(portfolioHistory, benchData, benchmark);
      if (merged.length > 0) return merged;
    }

    // Fallback: direct benchmark series if no overlapping portfolio snapshots
    return benchData.map((d) => ({
      date: d.date,
      label: d.date.slice(5),
      benchmark: Math.round(d.pct * 100) / 100,
      [benchmark]: Math.round(d.pct * 100) / 100,
      portfolio: 0,
    }));
  }, [data, benchmark, portfolioHistory]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black p-6 backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">
            Performance vs Benchmark
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Comparaison en % relatif (base 100 = 0%)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range */}
          <div className="flex gap-1 rounded-lg bg-zinc-800/60 p-1">
            {(["1W", "1M", "1Y", "Max"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  timeRange === r
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Benchmark Selector */}
          <select
            value={benchmark}
            onChange={(e) => setBenchmark(e.target.value as "cac40" | "msciWorld")}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 outline-none focus:border-violet-500"
          >
            <option value="cac40">CAC 40 (^FCHI)</option>
            <option value="msciWorld">MSCI World (CW8)</option>
          </select>
        </div>
      </div>

      <div className="h-80">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Données de benchmark indisponibles
          </div>
        ) : (
          <ResponsiveContainer width="99%" height="99%" debounce={50}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(value, name) => [
                  `${value}%`,
                  name === "portfolio"
                    ? "Mon Portefeuille"
                    : benchmark === "cac40"
                      ? "CAC 40"
                      : "MSCI World",
                ]}
                contentStyle={{
                  backgroundColor: "#09090b",
                  border: "1px solid #27272a",
                  borderRadius: "12px",
                }}
                itemStyle={{ color: "#fafafa" }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-zinc-300">
                    {value === "portfolio"
                      ? "Mon Portefeuille"
                      : benchmark === "cac40"
                        ? "CAC 40 (^FCHI)"
                        : "MSCI World (CW8)"}
                  </span>
                )}
              />

              {portfolioHistory.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="portfolio"
                  name="portfolio"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="benchmark"
                name={benchmark}
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
