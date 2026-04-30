"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const DUMMY_BENCHMARK_DATA = [
  { month: "Jan", portfolio: 5, cac40: 3, msciWorld: 4 },
  { month: "Fév", portfolio: 8, cac40: 4, msciWorld: 6 },
  { month: "Mar", portfolio: 4, cac40: -1, msciWorld: 2 },
  { month: "Avr", portfolio: 10, cac40: 2, msciWorld: 7 },
  { month: "Mai", portfolio: 15, cac40: 5, msciWorld: 12 },
  { month: "Juin", portfolio: 12, cac40: 6, msciWorld: 14 },
];

export default function BenchmarkChart() {
  const [benchmark, setBenchmark] = useState<"cac40" | "msciWorld">("cac40");

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-white dark:from-zinc-900/50 to-zinc-50 dark:to-black p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          Cumul de performance vs Benchmark
        </h2>
        <select
          value={benchmark}
          onChange={(e) => setBenchmark(e.target.value as any)}
          className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-violet-500"
        >
          <option value="cac40">CAC 40 GR (Dividendes Réinvestis)</option>
          <option value="msciWorld">MSCI World</option>
        </select>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="99%" height="99%" debounce={50}>
          <LineChart data={DUMMY_BENCHMARK_DATA}>
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
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(value) => [`${value}%`]}
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
                <span className="text-xs text-zinc-700 dark:text-zinc-300">
                  {value === "portfolio"
                    ? "Mon Portefeuille"
                    : value === "cac40"
                      ? "CAC 40"
                      : "MSCI World"}
                </span>
              )}
            />

            <Line
              type="monotone"
              dataKey="portfolio"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey={benchmark}
              stroke="#71717a"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
