import { TrendingUp, TrendingDown, X } from "lucide-react";
import { type TrendSignal, SIGNAL_CONFIG } from "@/lib/technical-analysis";

interface StockChartHeaderProps {
  ticker: string;
  name: string;
  displayPoint: { close: number } | null;
  isPositive: boolean;
  periodChange: number;
  periodChangePercent: number;
  signal: TrendSignal | null;
  onClose: () => void;
}

export function StockChartHeader({
  ticker,
  name,
  displayPoint,
  isPositive,
  periodChange,
  periodChangePercent,
  signal,
  onClose,
}: StockChartHeaderProps) {
  return (
    <div className="flex items-start justify-between border-b border-zinc-800/30 px-6 py-5">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">{name}</h2>
          <span className="rounded-full bg-zinc-800/80 px-2.5 py-0.5 text-xs font-semibold text-zinc-300 ring-1 ring-white/5">
            {ticker}
          </span>
          {signal && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${SIGNAL_CONFIG[signal].bgColor} ${SIGNAL_CONFIG[signal].color}`}
            >
              {SIGNAL_CONFIG[signal].emoji} {SIGNAL_CONFIG[signal].label}
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
      <button
        onClick={onClose}
        aria-label="Fermer le graphique"
        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
