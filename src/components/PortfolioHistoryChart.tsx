"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { formatEUR } from "@/lib/utils";

const CustomAreaTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/95 px-3 py-2 shadow-2xl backdrop-blur-sm">
        <p className="mb-1 text-xs font-medium text-zinc-400">
          {label
            ? format(parseISO(label), "d MMMM yyyy", { locale: fr })
            : ""}
        </p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-sm font-semibold"
            style={{ color: entry.color }}
          >
            {entry.name}: {formatEUR(entry.value as number)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface PortfolioHistoryChartProps {
  filteredHistory: Record<string, string | number>[];
}

export default function PortfolioHistoryChart({
  filteredHistory,
}: PortfolioHistoryChartProps) {
  if (filteredHistory.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Aucun historique disponible. Attendez 24h pour que les données
        soient enregistrées.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="99%" height="99%" debounce={50}>
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
          tickFormatter={(val) =>
            new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            }).format(val)
          }
          domain={["auto", "auto"]}
          width={80}
        />
        <Tooltip content={<CustomAreaTooltip />} />
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
  );
}
