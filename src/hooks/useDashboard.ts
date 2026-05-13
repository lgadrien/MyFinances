/**
 * src/hooks/useDashboard.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Encapsule la logique de chargement et de calcul du Dashboard.
 * La page `app/page.tsx` n'a plus qu'à appeler ce hook et s'occuper du rendu.
 */

import { useEffect, useState } from "react";
import {
  fetchStockPrice,
  fetchSettings,
  updateSettings,
} from "@/lib/data";
import { useTransactions } from "@/hooks/useTransactions";
import {
  calculateTotalInvested,
  calculateDividends,
  calculatePortfolioPositions,
  groupDividendsByMonth,
  type PortfolioPosition,
} from "@/lib/calculations";
import { FRENCH_INSTRUMENTS } from "@/lib/french-instruments";
import toast from "react-hot-toast";
import { useSettingsStore } from "@/stores/useSettingsStore";

export interface EnrichedPosition extends PortfolioPosition {
  currentPrice: number;
  plusValue: number;
  capitalValue: number;
}

export interface DashboardData {
  positions: EnrichedPosition[];
  dividendHistory: { month: string; amount: number }[];
  projectedDividends: { month: string; amount: number }[];
  portfolioHistory: any[];
  totalInvested: number;
  totalDividends: number;
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
  const [positions, setPositions] = useState<EnrichedPosition[]>([]);
  const [dividendHistory, setDividendHistory] = useState<
    { month: string; amount: number }[]
  >([]);
  const [projectedDividends, setProjectedDividends] = useState<
    { month: string; amount: number }[]
  >([]);
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalDividends, setTotalDividends] = useState(0);
  const [totalPlusValue, setTotalPlusValue] = useState(0);
  const [totalCapital, setTotalCapital] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [targetCapital, setTargetCapital] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { environment, privacyMode, currency } = useSettingsStore();
  const { transactions, isLoading: isTxLoading } = useTransactions();

  useEffect(() => {
    async function load() {
      // Si les transactions chargent, on attend
      if (isTxLoading) return;
      
      setLoading(true);
      try {
        // Paramètres utilisateur
        const settings = await fetchSettings(environment);
        if (settings) {
          setCashBalance(settings.cash_balance);
          setTargetCapital(settings.target_capital);
        } else {
          setCashBalance(0);
          setTargetCapital(10000);
        }

        // Fetch portfolio history
        const historyUrl = environment === "BINANCE" 
          ? "/api/binance/history" 
          : `/api/portfolio/history?environment=${environment}`;
          
        const historyRes = await fetch(historyUrl);
        const historyData = await historyRes.json();
        setPortfolioHistory(Array.isArray(historyData) ? historyData : []);

        if (environment === "BINANCE") {
          const res = await fetch("/api/binance/portfolio");
          if (res.ok) {
            const data = await res.json();
            const binancePositions = data.positions || [];
            
            setPositions(binancePositions);
            setTotalInvested(binancePositions.reduce((s: number, p: any) => s + (p.totalInvested || 0), 0));
            setTotalDividends(0);
            setTotalPlusValue(binancePositions.reduce((s: number, p: any) => s + (p.plusValue || 0), 0));
            setTotalCapital(binancePositions.reduce((s: number, p: any) => s + (p.capitalValue || 0), 0));
            setDividendHistory([]);
            setProjectedDividends([]);
          } else {
            console.error("Failed to fetch Binance portfolio");
            setPositions([]);
            setTotalInvested(0);
            setTotalDividends(0);
            setTotalPlusValue(0);
            setTotalCapital(0);
            setDividendHistory([]);
            setProjectedDividends([]);
          }
        } else {
          // Lookup table pour enrichir les positions avec nom/secteur
          const instrumentLookup = new Map(
            FRENCH_INSTRUMENTS.map((i) => [
              i.ticker,
              { name: i.name, sector: i.sector },
            ]),
          );

          const pos = calculatePortfolioPositions(transactions, instrumentLookup);

          // Prix live en parallèle
          const prices = await Promise.all(
            pos.map((p) => fetchStockPrice(p.ticker)),
          );

          const enriched: EnrichedPosition[] = pos.map((p, i) => {
            const currentPrice = prices[i]?.price ?? p.pru;
            return {
              ...p,
              currentPrice,
              plusValue: (currentPrice - p.pru) * p.totalQuantity,
              capitalValue: currentPrice * p.totalQuantity,
            };
          });

          setPositions(enriched);
          setTotalInvested(calculateTotalInvested(transactions));
          setTotalDividends(calculateDividends(transactions));
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
                projectedMap.set(key, (projectedMap.get(key) ?? 0) + (d.total_amount || 0));
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
              .map(([month, amount]) => ({ month, amount }))
              .slice(0, 4),
          );
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [transactions, isTxLoading, environment]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const ok = await updateSettings(cashBalance, targetCapital, environment);
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
    portfolioHistory,
    totalInvested,
    totalDividends,
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
