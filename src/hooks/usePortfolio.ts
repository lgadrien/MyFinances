/**
 * src/hooks/usePortfolio.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Encapsule la logique de chargement et de calcul de la page Portefeuille.
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import { subDays, subMonths, subYears, parseISO } from "date-fns";
import { fetchStockPrice } from "@/lib/data";
import { useTransactions } from "@/hooks/useTransactions";
import {
  calculatePortfolioPositions,
  type PortfolioPosition,
} from "@/lib/calculations";
import { FRENCH_INSTRUMENTS } from "@/lib/french-instruments";

export type TimeRange = "1W" | "1M" | "1Y" | "Max";

export interface EnrichedPortfolioPosition extends PortfolioPosition {
  currentPrice: number;
  capitalValue: number;
  plusValue: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HistoryPoint = Record<string, any>;

export interface UsePortfolioReturn {
  positions: EnrichedPortfolioPosition[];
  filteredHistory: HistoryPoint[];
  timeRange: TimeRange;
  setTimeRange: (r: TimeRange) => void;
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
  totalPerformance: number;
  sectorData: { name: string; value: number; percent: number }[];
  assetData: { name: string; value: number; percent: number }[];
}

export function usePortfolio(): UsePortfolioReturn {
  const [positions, setPositions] = useState<EnrichedPortfolioPosition[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryPoint[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");
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

  const environment = useSettingsStore((s) => s.environment);

  const loadData = useCallback(async () => {
    if (isTxLoading) return;
    
    try {
      setRefreshing(true);
      setLoading(true);
      const initialPositions = calculatePortfolioPositions(transactions, instrumentMap);

      const historyRes = await fetch(`/api/portfolio/history?environment=${environment}`);
      const historyData = await historyRes.json();
      setHistory(Array.isArray(historyData) ? historyData : []);

      const activePositions = initialPositions.filter(
        (p) => p.totalQuantity > 0.0001,
      );

      const enriched = await Promise.all(
        activePositions.map(async (pos) => {
          const priceData = await fetchStockPrice(pos.ticker);
          const currentPrice = priceData?.price ?? 0;
          const capitalValue = currentPrice * pos.totalQuantity;
          const plusValue = capitalValue - pos.totalInvested;
          return {
            ...pos,
            currentPrice,
            capitalValue,
            plusValue,
          } as EnrichedPortfolioPosition;
        }),
      );

      setPositions(enriched);

      // Init target allocations une seule fois
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
  }, [instrumentMap, transactions, isTxLoading, environment]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrage de l'historique selon la période sélectionnée
  useEffect(() => {
    if (!history.length) {
      setFilteredHistory([]);
      return;
    }
    const now = new Date();
    let filtered = [...history];
    if (timeRange === "1W")
      filtered = history.filter((d) => parseISO(d.date) >= subDays(now, 7));
    else if (timeRange === "1M")
      filtered = history.filter((d) => parseISO(d.date) >= subMonths(now, 1));
    else if (timeRange === "1Y")
      filtered = history.filter((d) => parseISO(d.date) >= subYears(now, 1));
    setFilteredHistory(filtered);
  }, [history, timeRange]);

  // Calcul des données pour les pie charts
  const sectorData = useMemo(() => {
    const sectors: Record<string, number> = {};
    positions.forEach((p) => {
      const s = p.sector || "Autre";
      sectors[s] = (sectors[s] || 0) + (p.capitalValue || 0);
    });
    const total = Object.values(sectors).reduce((a, b) => a + b, 0);
    return Object.entries(sectors)
      .map(([name, value]) => ({
        name,
        value,
        percent: total > 0 ? value / total : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [positions]);

  const assetData = useMemo(() => {
    const total = positions.reduce((s, p) => s + (p.capitalValue || 0), 0);
    return positions
      .map((p) => ({
        name: p.name,
        value: p.capitalValue || 0,
        percent: total > 0 ? (p.capitalValue || 0) / total : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [positions]);

  const totalInvested = positions.reduce((s, p) => s + p.totalInvested, 0);
  const totalValue = positions.reduce((s, p) => s + (p.capitalValue || 0), 0);
  const totalPV = totalValue - totalInvested;
  const totalPerformance = totalInvested > 0 ? totalPV / totalInvested : 0;

  return {
    positions,
    filteredHistory,
    timeRange,
    setTimeRange,
    loading,
    refreshing,
    refresh: loadData,
    isRebalancingOpen,
    setIsRebalancingOpen,
    rebalanceCash,
    setRebalanceCash,
    targetAllocations,
    setTargetAllocations,
    totalInvested,
    totalValue,
    totalPV,
    totalPerformance,
    sectorData,
    assetData,
  };
}
