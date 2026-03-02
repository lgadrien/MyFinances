/**
 * src/components/ui/PositionSparklineCell.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Cellule de tableau qui charge et affiche la sparkline d'une position.
 * Gère les états de chargement et d'erreur proprement.
 */

"use client";

import Sparkline from "./Sparkline";
import { useSparklineData } from "@/hooks/useSparklineData";

interface PositionSparklineCellProps {
  ticker: string;
  isPositive: boolean;
}

export default function PositionSparklineCell({
  ticker,
  isPositive,
}: PositionSparklineCellProps) {
  const { data, isLoading } = useSparklineData(ticker);

  if (isLoading) {
    return (
      <div className="flex h-8 w-[80px] items-center justify-center">
        <div className="h-[2px] w-full animate-pulse rounded-full bg-zinc-800" />
      </div>
    );
  }

  if (!data || data.length < 2) {
    return <span className="text-xs text-zinc-700">—</span>;
  }

  return <Sparkline data={data} width={80} height={32} positive={isPositive} />;
}
