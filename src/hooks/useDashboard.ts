/**
 * src/hooks/useDashboard.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Encapsule la logique de chargement et de calcul du Dashboard.
 * La page `app/page.tsx` n'a plus qu'à appeler ce hook et s'occuper du rendu.
 */

import { useEffect, useMemo, useState } from "react";
import { parseISO, subDays, subMonths, subYears } from "date-fns";
import {
  fetchBatchStockPrices,
  fetchSettings,
  updateSettings,
} from "@/lib/data";
import { useTransactions } from "@/hooks/useTransactions";
import type { HistoryPoint } from "@/hooks/usePortfolio";
import {
  calculateDailyChange,
  calculatePortfolioPositions,
  enrichPositions,
  groupDividendsByMonth,
  type EnrichedPortfolioPosition,
} from "@/lib/calculations";
import { FRENCH_INSTRUMENTS } from "@/lib/french-instruments";
import toast from "react-hot-toast";

export type TimeRange = "1W" | "1M" | "1Y" | "Max";

export interface DashboardData {
  positions: EnrichedPortfolioPosition[];
  dividendHistory: { month: string; amount: number }[];
  projectedDividends: { month: string; amount: number }[];
  filteredHistory: HistoryPoint[];
  timeRange: TimeRange;
  setTimeRange: (r: TimeRange) => void;
  dailyChange: { amount: number; percent: number };
  totalInvested: number;
  totalPlusValue: number;
  totalCapital: number;
  cashBalance: number;
  targetCapital: number;
  loading: boolean;
  savingSettings: boolean;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (v: boolean) => void;
  setCashBalance: (v: number) => void;
  setTargetCapital: (v: number) => void;
  handleSaveSettings: () => Promise<void>;
}

export function useDashboard(): DashboardData {
  const [positions, setPositions] = useState<EnrichedPortfolioPosition[]>([]);
  const [dividendHistory, setDividendHistory] = useState<
    { month: string; amount: number }[]
  >([]);
  const [projectedDividends, setProjectedDividends] = useState<
    { month: string; amount: number }[]
  >([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");
  const [dailyChange, setDailyChange] = useState({ amount: 0, percent: 0 });
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalPlusValue, setTotalPlusValue] = useState(0);
  const [totalCapital, setTotalCapital] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [targetCapital, setTargetCapital] = useState(10000);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { transactions, isLoading: isTxLoading } = useTransactions();

  useEffect(() => {
    async function load() {
      // Si les transactions chargent, on attend
      if (isTxLoading) return;

      try {
        // Paramètres utilisateur
        const settings = await fetchSettings();
        if (settings) {
          setCashBalance(settings.cash_balance);
          setTargetCapital(settings.target_capital);
          setSettingsLoaded(true);
        }

        // Lookup table pour enrichir les positions avec nom/secteur
        const instrumentLookup = new Map(
          FRENCH_INSTRUMENTS.map((i) => [
            i.ticker,
            { name: i.name, sector: i.sector },
          ]),
        );

        const pos = calculatePortfolioPositions(transactions, instrumentLookup);

        // Prix live via un seul appel batch (1 requête HTTP au lieu de N), en parallèle de l'historique
        const [quotes, historyData] = await Promise.all([
          fetchBatchStockPrices(pos.map((p) => p.ticker)),
          fetch("/api/portfolio/history").then((r) => r.json()).catch(() => []),
        ]);
        const missing = pos.filter((p) => !quotes[p.ticker]).map((p) => p.ticker);
        if (missing.length) {
          toast.error(`Cours indisponible, valorisé au PRU : ${missing.join(", ")}`, { id: "missing-quotes" });
        }

        const enriched = enrichPositions(pos, quotes);

        setPositions(enriched);
        setHistory(Array.isArray(historyData) ? historyData : []);
        setDailyChange(calculateDailyChange(enriched, quotes));
        setTotalInvested(enriched.reduce((s, p) => s + p.totalInvested, 0));
        setTotalPlusValue(enriched.reduce((s, p) => s + (p.plusValue || 0), 0));
        setTotalCapital(enriched.reduce((s, p) => s + (p.capitalValue || 0), 0));
        setDividendHistory(groupDividendsByMonth(transactions));

        // Projections dividendes (basées sur N-1)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const lastYearDivs = transactions.filter(
          (t) => t.type === "Dividende" && new Date(t.date) >= oneYearAgo,
        );

        const projectedMap = new Map<string, number>();
        for (const d of lastYearDivs) {
          const position = enriched.find((p) => p.ticker === d.ticker);
          if (position && position.totalQuantity > 0) {
            try {
              const dDate = new Date(d.date);
              if (isNaN(dDate.getTime())) continue; // Skip invalid dates
              
              dDate.setFullYear(dDate.getFullYear() + 1);
              const key = dDate.toISOString().substring(0, 7);
              projectedMap.set(key, (projectedMap.get(key) ?? 0) + (d.total_amount || 0) - (d.fees || 0));
            } catch (e) {
              console.warn("Invalid date in transaction", d.date, e);
              continue;
            }
          }
        }

        setProjectedDividends(
          Array.from(projectedMap.entries())
            .filter(([m]) => m >= new Date().toISOString().substring(0, 7))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, amount]) => ({ month, amount })),
        );
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [transactions, isTxLoading]);

  // Filtrage de l'historique selon la période sélectionnée
  const filteredHistory = useMemo(() => {
    const now = new Date();
    if (timeRange === "1W")
      return history.filter((d) => parseISO(d.date) >= subDays(now, 7));
    if (timeRange === "1M")
      return history.filter((d) => parseISO(d.date) >= subMonths(now, 1));
    if (timeRange === "1Y")
      return history.filter((d) => parseISO(d.date) >= subYears(now, 1));
    return history;
  }, [history, timeRange]);

  const handleSaveSettings = async () => {
    // Paramètres jamais chargés : sauvegarder écraserait le vrai solde par les valeurs par défaut
    if (!settingsLoaded) {
      toast.error("Paramètres non chargés : sauvegarde bloquée pour ne pas écraser vos valeurs.");
      return;
    }
    setSavingSettings(true);
    const ok = await updateSettings(cashBalance, targetCapital);
    if (ok) {
      toast.success("Paramètres synchronisés !");
      setIsSettingsOpen(false);
    } else {
      toast.error("Erreur de synchronisation.");
    }
    setSavingSettings(false);
  };

  return {
    positions,
    dividendHistory,
    projectedDividends,
    filteredHistory,
    timeRange,
    setTimeRange,
    dailyChange,
    totalInvested,
    totalPlusValue,
    totalCapital,
    cashBalance,
    targetCapital,
    loading,
    savingSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    setCashBalance,
    setTargetCapital,
    handleSaveSettings,
  };
}
