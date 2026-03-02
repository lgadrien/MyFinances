/**
 * src/hooks/useSparklineData.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Charge l'historique de prix sur 7 jours pour un ticker donné.
 * Utilise TanStack Query pour le cache — les données sont partagées
 * si plusieurs composants demandent le même ticker.
 */

import { useQuery } from "@tanstack/react-query";

interface OHLCVPoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

async function fetchSparkline(ticker: string): Promise<number[]> {
  const res = await fetch(
    `/api/stock/history?ticker=${encodeURIComponent(ticker)}&range=1mo&interval=1d`,
    { signal: AbortSignal.timeout(5000) },
  );
  if (!res.ok) return [];
  const data: OHLCVPoint[] = await res.json();
  if (!Array.isArray(data)) return [];

  // Prend les 10 derniers points de clôture
  return data
    .slice(-10)
    .map((d) => d.close)
    .filter((v) => typeof v === "number" && !isNaN(v));
}

export function useSparklineData(ticker: string, enabled = true) {
  return useQuery({
    queryKey: ["sparkline", ticker],
    queryFn: () => fetchSparkline(ticker),
    enabled: enabled && !!ticker,
    staleTime: 5 * 60 * 1000, // 5 min — données pas ultra fraîches
    gcTime: 10 * 60 * 1000, // 10 min en cache
    retry: 1,
  });
}
