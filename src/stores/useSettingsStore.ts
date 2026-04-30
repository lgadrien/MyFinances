import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  currency: "EUR" | "USD";
  privacyMode: boolean;
  setCurrency: (currency: "EUR" | "USD") => void;
  togglePrivacyMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: "EUR",
      privacyMode: false,
      setCurrency: (currency) => set({ currency }),
      togglePrivacyMode: () => set((state) => ({ privacyMode: !state.privacyMode })),
    }),
    {
      name: "myfinances-settings",
    }
  )
);
