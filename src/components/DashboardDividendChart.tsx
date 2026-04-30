"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_TOOLTIP_STYLE } from "@/lib/utils";

interface DashboardDividendChartProps {
  dividendHistory: { month: string; amount: number }[];
}

export default function DashboardDividendChart({
  dividendHistory,
}: DashboardDividendChartProps) {
  return (
    <ResponsiveContainer width="99%" height="99%" debounce={50}>
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
          {...CHART_TOOLTIP_STYLE}
          cursor={{ fill: "rgba(139, 92, 246, 0.08)" }}
        />
        <Bar
          dataKey="amount"
          fill="url(#barGradientDash)"
          radius={[6, 6, 0, 0]}
          maxBarSize={40}
        />
        <defs>
          <linearGradient id="barGradientDash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.25} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
