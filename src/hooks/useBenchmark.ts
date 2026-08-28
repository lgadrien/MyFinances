/**
 * src/hooks/useBenchmark.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Charge les données historiques de CAC 40 et MSCI World via l'API stock/history,
 * puis les normalise en performance % relative par rapport à la première date
 * du portefeuille (base 100 = 0%).
 */

import { useQuery } from "@tanstack/react-query";
import { parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";

export type BenchmarkRange = "1W" | "1M" | "1Y" | "Max";

interface OHLCVPoint {
  date: string;
  close: number;
}

const RANGE_INTERVAL_MAP: Record<BenchmarkRange, string> = {
  "1W": "15min",
  "1M": "daily",
  "1Y": "weekly",
  Max: "weekly",
};

/** Fetche + normalise un ticker en % cumulé, base = 0 au 1er point */
async function fetchNormalized(
  ticker: string,
  interval: string,
): Promise<{ date: string; pct: number }[]> {
  try {
    const res = await fetch(
      `/api/stock/history?ticker=${encodeURIComponent(ticker)}&interval=${interval}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const raw: OHLCVPoint[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
        ? json.data
        : [];

    if (!raw.length) return [];

    const base = raw[0].close;
    return raw.map((p) => ({
      date: p.date.split(" ")[0],
      pct: base > 0 ? ((p.close - base) / base) * 100 : 0,
    }));
  } catch {
    return [];
  }
}

export function useBenchmark(timeRange: BenchmarkRange) {
  return useQuery({
    queryKey: ["benchmark", timeRange],
    queryFn: async () => {
      const interval = RANGE_INTERVAL_MAP[timeRange] || "daily";
      const [cac40, msciWorld] = await Promise.all([
        fetchNormalized("^FCHI", interval),
        fetchNormalized("CW8.PA", interval),
      ]);
      return { cac40, msciWorld };
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

/** Fusionne historique portefeuille + benchmark sur dates communes. */
export function mergeBenchmarkData(
  portfolioHistory: { date: string; total_value: number }[],
  benchmarkData: { date: string; pct: number }[],
  benchmarkKey: "cac40" | "msciWorld",
): { date: string; portfolio: number; benchmark: number; label: string }[] {
  if (!portfolioHistory.length || !benchmarkData.length) return [];

  const firstValue = portfolioHistory[0]?.total_value ?? 0;
  const benchMap = new Map(
    benchmarkData.map((d) => [d.date.slice(0, 10), d.pct]),
  );

  const result: {
    date: string;
    portfolio: number;
    benchmark: number;
    label: string;
  }[] = [];

  for (const h of portfolioHistory) {
    const dateKey = h.date.slice(0, 10);
    const bPct = benchMap.get(dateKey);
    if (bPct === undefined) continue;

    const portfolioPct =
      firstValue > 0 ? ((h.total_value - firstValue) / firstValue) * 100 : 0;

    result.push({
      date: dateKey,
      portfolio: Math.round(portfolioPct * 100) / 100,
      [benchmarkKey]: Math.round(bPct * 100) / 100,
      benchmark: Math.round(bPct * 100) / 100,
      label: format(parseISO(dateKey), "d MMM yy", { locale: fr }),
    });
  }

  return result;
}
