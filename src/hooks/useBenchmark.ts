/**
 * src/hooks/useBenchmark.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Charge les données historiques de CAC 40 et MSCI World via l'API stock/history,
 * puis les normalise en performance % relative par rapport à la première date
 * du portefeuille (base 100 = 0%).
 *
 * Tickers Yahoo Finance :
 *   ^FCHI   = CAC 40
 *   CW8.PA  = Amundi MSCI World (éligible PEA) — coté sur Euronext Paris
 */

import { useQuery } from "@tanstack/react-query";
import { parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";

type Range = "1W" | "1M" | "1Y" | "Max";

interface OHLCVPoint {
  date: string;
  close: number;
}

const RANGE_MAP: Record<Range, { range: string; interval: string }> = {
  "1W": { range: "5d", interval: "1d" },
  "1M": { range: "1mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1wk" },
  Max: { range: "5y", interval: "1mo" },
};

/** Fetche + normalise un ticker en % cumulé, base = 0 au 1er point */
async function fetchNormalized(
  ticker: string,
  range: string,
  interval: string,
): Promise<{ date: string; pct: number }[]> {
  const res = await fetch(
    `/api/stock/history?ticker=${encodeURIComponent(ticker)}&range=${range}&interval=${interval}`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) return [];
  const raw: OHLCVPoint[] = await res.json();
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const base = raw[0].close;
  return raw.map((p) => ({
    date: p.date,
    pct: base > 0 ? ((p.close - base) / base) * 100 : 0,
  }));
}

export function useBenchmark(timeRange: Range) {
  return useQuery({
    queryKey: ["benchmark", timeRange],
    queryFn: async () => {
      const { range, interval } = RANGE_MAP[timeRange];
      const [cac40, msciWorld] = await Promise.all([
        fetchNormalized("^FCHI", range, interval),
        fetchNormalized("CW8.PA", range, interval),
      ]);
      return { cac40, msciWorld };
    },
    staleTime: 15 * 60 * 1000, // 15 min
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

/** Fusionne historique portefeuille + benchmark sur dates communes.
 *  Le portefeuille est normalisé en % à partir de sa première valeur.
 */
export function mergeBenchmarkData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  portfolioHistory: any[],
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
