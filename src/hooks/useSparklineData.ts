/**
 * src/hooks/useSparklineData.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Charge l'historique de prix pour un ticker donné afin d'afficher la sparkline.
 * Utilise TanStack Query pour le cache et la déduplication des requêtes.
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
  try {
    const res = await fetch(
      `/api/stock/history?ticker=${encodeURIComponent(ticker)}&interval=daily`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const list: OHLCVPoint[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
        ? json.data
        : [];

    if (!list.length) return [];

    // Prend les 10 derniers points de clôture
    return list
      .slice(-10)
      .map((d) => d.close)
      .filter((v) => typeof v === "number" && !isNaN(v));
  } catch {
    return [];
  }
}

export function useSparklineData(ticker: string, enabled = true) {
  return useQuery({
    queryKey: ["sparkline", ticker],
    queryFn: () => fetchSparkline(ticker),
    enabled: enabled && !!ticker,
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}
