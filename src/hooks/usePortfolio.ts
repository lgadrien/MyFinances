/**
 * src/hooks/usePortfolio.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Encapsule la logique de chargement et de calcul de la page Portefeuille PEA.
 */

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { fetchBatchStockPrices, fetchSettings } from "@/lib/data";
import { useTransactions } from "@/hooks/useTransactions";
import {
  calculateDividends,
  calculatePlanGain,
  calculatePortfolioPositions,
  enrichPositions,
  peaTaxRate,
  type EnrichedPortfolioPosition,
} from "@/lib/calculations";
import { FRENCH_INSTRUMENTS } from "@/lib/french-instruments";

export type HistoryPoint = { date: string; total_value: number; total_invested: number };

export interface UsePortfolioReturn {
  positions: EnrichedPortfolioPosition[];
  history: HistoryPoint[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
  isRebalancingOpen: boolean;
  setIsRebalancingOpen: (v: boolean) => void;
  rebalanceCash: number;
  setRebalanceCash: (v: number) => void;
  targetAllocations: Record<string, number>;
  setTargetAllocations: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  totalInvested: number;
  totalValue: number;
  totalPV: number;
  cashBalance: number;
  totalDividends: number;
  planGain: number;
  taxRate: number;
}

export function usePortfolio(): UsePortfolioReturn {
  const [positions, setPositions] = useState<EnrichedPortfolioPosition[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRebalancingOpen, setIsRebalancingOpen] = useState(false);
  const [rebalanceCash, setRebalanceCash] = useState(0);
  const [targetAllocations, setTargetAllocations] = useState<
    Record<string, number>
  >({});

  const instrumentMap = useMemo(() => {
    const map = new Map<string, { name: string; sector: string }>();
    FRENCH_INSTRUMENTS.forEach((i) =>
      map.set(i.ticker, { name: i.name, sector: i.sector }),
    );
    return map;
  }, []);

  const { transactions, isLoading: isTxLoading } = useTransactions();

  const [reloadKey, setReloadKey] = useState(0);

  // Chargement défini dans l'effet : ses setState n'arrivent qu'après un await
  useEffect(() => {
    if (isTxLoading) return;

    async function loadData() {
      try {
        // Positions first: the three requests below are independent and run in parallel
        const activePositions = calculatePortfolioPositions(
          transactions,
          instrumentMap,
        );

        const [historyData, settings, quotes] = await Promise.all([
          fetch("/api/portfolio/history").then((r) => r.json()),
          fetchSettings(),
          // Prix live via un seul appel batch (1 requête HTTP au lieu de N)
          fetchBatchStockPrices(activePositions.map((p) => p.ticker)),
        ]);
        setHistory(Array.isArray(historyData) ? historyData : []);
        if (settings) setCashBalance(settings.cash_balance);

        const missing = activePositions.filter((p) => !quotes[p.ticker]).map((p) => p.ticker);
        if (missing.length) {
          toast.error(`Cours indisponible, valorisé au PRU : ${missing.join(", ")}`, { id: "missing-quotes" });
        }

        const enriched = enrichPositions(activePositions, quotes);

        setPositions(enriched);

        // Init target allocations
        setTargetAllocations((prev) => {
          if (Object.keys(prev).length > 0 || enriched.length === 0) return prev;
          const total = enriched.reduce((s, p) => s + (p.capitalValue ?? 0), 0);
          const targets: Record<string, number> = {};
          for (const p of enriched) {
            targets[p.ticker] =
              total > 0 ? ((p.capitalValue ?? 0) / total) * 100 : 0;
          }
          return targets;
        });
      } catch (err) {
        console.error("Failed to load portfolio:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }

    loadData();
  }, [instrumentMap, transactions, isTxLoading, reloadKey]);

  const totalInvested = positions.reduce((s, p) => s + p.totalInvested, 0);
  const totalValue = positions.reduce((s, p) => s + (p.capitalValue || 0), 0);
  const totalPV = totalValue - totalInvested;
  const totalDividends = calculateDividends(transactions);
  const planGain = calculatePlanGain(transactions, totalValue);
  const today = format(new Date(), "yyyy-MM-dd");
  const firstDate = transactions.reduce((min, t) => (t.date < min ? t.date : min), today);
  const taxRate = peaTaxRate(firstDate, today);

  return {
    positions,
    history,
    loading,
    refreshing,
    refresh: () => {
      setRefreshing(true);
      setReloadKey((k) => k + 1);
    },
    isRebalancingOpen,
    setIsRebalancingOpen,
    rebalanceCash,
    setRebalanceCash,
    targetAllocations,
    setTargetAllocations,
    totalInvested,
    totalValue,
    totalPV,
    cashBalance,
    totalDividends,
    planGain,
    taxRate,
  };
}
