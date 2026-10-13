import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import { fetchStockPrice } from "@/lib/data";

interface SettingsState {
  currency: "EUR" | "USD";
  privacyMode: boolean;
  /** Live EUR→USD rate, fetched when USD is selected (never persisted, so never stale). */
  usdRate: number | null;
  setCurrency: (currency: "EUR" | "USD") => Promise<void>;
  togglePrivacyMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: "EUR",
      privacyMode: false,
      usdRate: null,
      setCurrency: async (currency) => {
        const quote = currency === "USD" ? await fetchStockPrice("EURUSD=X") : null;
        if (currency === "USD" && !quote) {
          toast.error("Taux EUR/USD indisponible, affichage en euros.");
          set({ currency: "EUR" });
        } else {
          set({ currency, usdRate: quote?.price ?? null });
        }
      },
      togglePrivacyMode: () =>
        set((state) => ({ privacyMode: !state.privacyMode })),
    }),
    {
      name: "myfinances-settings",
      partialize: ({ currency, privacyMode }) => ({ currency, privacyMode }),
      // Persisted USD choice → fetch a fresh rate on load
      onRehydrateStorage: () => (state) => {
        if (state?.currency === "USD") state.setCurrency("USD");
      },
    },
  ),
);
