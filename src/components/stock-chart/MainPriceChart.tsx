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
import { type ReactNode } from "react";

export interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MainPriceChartProps {
  data: HistoryPoint[];
  minPrice: number;
  maxPrice: number;
  pricePadding: number;
  avgPrice: number;
  gradientId: string;
  gradientColor: string;
  formatDateLabel: (d: string) => string;
  setCrosshairData: (point: HistoryPoint | null) => void;
}

export function MainPriceChart({
  data,
  minPrice,
  maxPrice,
  pricePadding,
  avgPrice,
  gradientId,
  gradientColor,
  formatDateLabel,
  setCrosshairData,
}: MainPriceChartProps) {
  return (
    <div className="px-4 py-4" style={{ height: 280 }}>
      <ResponsiveContainer width="99%" height="99%" debounce={50}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          onMouseMove={(state) => {
            const s = state as { activePayload?: { payload: HistoryPoint }[] };
            if (s?.activePayload?.[0]?.payload) {
              setCrosshairData(s.activePayload[0].payload);
            }
          }}
          onMouseLeave={() => setCrosshairData(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={gradientColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
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
            formatter={(value: number | string | undefined) => [
              `${Number(value).toFixed(2)} €`,
              "Clôture",
            ]}
            labelFormatter={(label: ReactNode) => {
              const s = String(label);
              const d = new Date(s.replace(" ", "T"));
              if (isNaN(d.getTime())) return s;

              const datePart = d.toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "2-digit",
                month: "long",
                year: "numeric",
              });

              if (s.includes(" ")) {
                const timePart = s.split(" ")[1];
                return `${datePart} à ${timePart}`;
              }
              return datePart;
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
    </div>
  );
}
