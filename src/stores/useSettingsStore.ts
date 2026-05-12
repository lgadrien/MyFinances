import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Environment = "PEA" | "BINANCE";

interface SettingsState {
  currency: "EUR" | "USD";
  privacyMode: boolean;
  environment: Environment;
  setCurrency: (currency: "EUR" | "USD") => void;
  togglePrivacyMode: () => void;
  setEnvironment: (env: Environment) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: "EUR",
      privacyMode: false,
      environment: "PEA",
      setCurrency: (currency) => set({ currency }),
      togglePrivacyMode: () => set((state) => ({ privacyMode: !state.privacyMode })),
      setEnvironment: (env) => set({ environment: env }),
    }),
    {
      name: "myfinances-settings",
    }
  )
);
