/**
 * src/hooks/useTargetPrices.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Stocke les prix cibles (take profit) par ticker dans localStorage.
 * Zéro modification de la BD — peut être migré vers Supabase facilement.
 *
 * Clé localStorage : "myfinances_target_prices"
 *
 * Usage :
 *   const { targetPrices, setTargetPrice } = useTargetPrices();
 *   setTargetPrice("AIR.PA", 180.50);   // définir
 *   setTargetPrice("AIR.PA", null);     // supprimer
 */

"use client";

import { useLocalStorage } from "./useLocalStorage";

type TargetPrices = Record<string, number>; // ticker → prix cible

export function useTargetPrices() {
  const [targetPrices, setTargetPrices] = useLocalStorage<TargetPrices>(
    "myfinances_target_prices",
    {},
  );

  const setTargetPrice = (ticker: string, price: number | null) => {
    setTargetPrices((prev) => {
      const next = { ...prev };
      if (price === null || isNaN(price) || price <= 0) {
        delete next[ticker];
      } else {
        next[ticker] = price;
      }
      return next;
    });
  };

  /** Progression vers l'objectif : 0 (au PRU) → 1 (objectif atteint) */
  const getProgress = (
    ticker: string,
    pru: number,
    currentPrice: number,
  ): number | null => {
    const target = targetPrices[ticker];
    if (!target || target <= pru) return null;
    return Math.min(Math.max((currentPrice - pru) / (target - pru), 0), 1);
  };

  return { targetPrices, setTargetPrice, getProgress };
}
