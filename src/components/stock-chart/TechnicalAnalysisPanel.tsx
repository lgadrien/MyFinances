import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { type TrendSignal, SIGNAL_CONFIG } from "@/lib/technical-analysis";

// Gauge component
function RSIGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = clamped < 30 ? "#10b981" : clamped > 70 ? "#ef4444" : "#a1a1aa";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 100 60" className="w-full">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#27272a"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(clamped / 100) * 125.6} 125.6`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
          <line x1="26" y1="44" x2="22" y2="38" stroke="#10b981" strokeWidth="1.5" opacity="0.5" />
          <line x1="74" y1="44" x2="78" y2="38" stroke="#ef4444" strokeWidth="1.5" opacity="0.5" />
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

// Badge component
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

// Score Bar component
function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 2 ? "#10b981" : score >= 0 ? "#a1a1aa" : score >= -2 ? "#f59e0b" : "#ef4444";

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

interface TechnicalAnalysisPanelProps {
  trendScore: any;
  enrichedData: any[];
  signalCfg: any;
  formatDateLabel: (d: string) => string;
}

export function TechnicalAnalysisPanel({
  trendScore,
  enrichedData,
  signalCfg,
  formatDateLabel,
}: TechnicalAnalysisPanelProps) {
  if (!trendScore) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        Données insuffisantes pour l&apos;analyse (minimum 10 points requis)
      </div>
    );
  }

  return (
    <div className="space-y-0 divide-y divide-zinc-800/50">
      {/* Signal global */}
      <div className="px-6 py-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-300">Signal global</span>
          <span className="text-xs text-zinc-500">Confiance : {trendScore.confidence}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-extrabold ${signalCfg?.color}`}>
            {signalCfg?.emoji} {signalCfg?.label}
          </span>
        </div>
        <div className="mt-3">
          <ScoreBar score={trendScore.score} />
        </div>
      </div>

      {/* Indicateurs individuels */}
      <div className="grid grid-cols-3 gap-px bg-zinc-800/30 sm:grid-cols-6">
        {[
          { label: "RSI", signal: trendScore.details.rsiSignal },
          { label: "MACD", signal: trendScore.details.macdSignal },
          { label: "Bollinger", signal: trendScore.details.bollingerSignal },
          { label: "Moyenn. EMA", signal: trendScore.details.emaSignal },
          { label: "Momentum", signal: trendScore.details.momentumSignal },
          { label: "Volume", signal: trendScore.details.volumeSignal },
        ].map(({ label, signal }) => (
          <div key={label} className="flex flex-col items-center gap-2 bg-zinc-900/50 px-3 py-4">
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

        {trendScore.indicators.rsi !== null && (
          <div className="mb-4 flex items-center gap-6">
            <RSIGauge value={trendScore.indicators.rsi} />
            <div className="space-y-1.5 text-xs text-zinc-400">
              <p>
                RSI <span className="font-bold text-white">{trendScore.indicators.rsi}</span>
              </p>
              <p className="text-zinc-600">
                {"<"}30 = survente (achat) · {">"}70 = surachat (vente)
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            { label: "MACD", value: trendScore.indicators.macd, suffix: "" },
            { label: "Histogramme MACD", value: trendScore.indicators.macdHistogram, suffix: "" },
            { label: "EMA 20", value: trendScore.indicators.ema20, suffix: " €" },
            { label: "EMA 50", value: trendScore.indicators.ema50, suffix: " €" },
            {
              label: "Bollinger %B",
              value:
                trendScore.indicators.bollingerPercentB !== null
                  ? (trendScore.indicators.bollingerPercentB * 100).toFixed(0)
                  : null,
              suffix: "%",
            },
            { label: "ATR (volatilité)", value: trendScore.indicators.atrPercent, suffix: "%" },
            {
              label: "Surtension Volume",
              value: trendScore.indicators.volumeSurgeMultiplier,
              suffix: "x",
            },
          ].map(({ label, value, suffix }) => (
            <div key={label} className="flex justify-between rounded-lg bg-zinc-800/40 px-3 py-2">
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
          <p className="mb-2 px-2 text-xs font-semibold text-zinc-500">RSI (14)</p>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="99%" height="99%" debounce={50}>
              <LineChart data={enrichedData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
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
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 2" strokeOpacity={0.6} />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 2" strokeOpacity={0.6} />
                <ReferenceLine y={50} stroke="#475569" strokeDasharray="2 4" strokeOpacity={0.4} />
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
          <p className="mb-2 px-2 text-xs font-semibold text-zinc-500">MACD (12/26/9)</p>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="99%" height="99%" debounce={50}>
              <BarChart data={enrichedData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
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
                <Bar dataKey="macdHistogram" name="Histogramme" radius={[2, 2, 0, 0]}>
                  {enrichedData.map((entry, index) => (
                    <Cell
                      key={`macd-cell-${index}`}
                      fill={(entry.macdHistogram ?? 0) >= 0 ? "#10b981" : "#ef4444"}
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
        ⚠️ Analyse technique fournie à titre indicatif uniquement. Ne constitue pas un conseil en
        investissement.
      </div>
    </div>
  );
}
