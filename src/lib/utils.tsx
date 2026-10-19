/**
 * src/lib/utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilitaires partagés entre toutes les pages et composants.
 * Importez depuis ici plutôt que de recréer les mêmes fonctions localement.
 */

// ─── Formatters monnaie / pourcentage ────────────────────────────────────────

import { useSettingsStore } from "@/stores/useSettingsStore";

// Built once: creating an Intl.NumberFormat is slow, and these run for every table cell
// fr-FR groups thousands with U+202F, nearly invisible in large figures ("21484,00 €"): show a regular no-break space
const visibleSpaces = (s: string) => s.replace(/\u202f/g, "\u00a0");
const EUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NUMBER_FR = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NUMBER_US = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PERCENT = new Intl.NumberFormat("fr-FR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Formate un nombre avec devise et gère le mode Privacy */
export const formatEUR = (n: number): string => {
  const { privacyMode, currency, usdRate } = useSettingsStore.getState();
  if (privacyMode) return "****";

  // Until the live rate has loaded, amounts stay in EUR rather than using a made-up rate
  return visibleSpaces(currency === "USD" && usdRate !== null ? USD.format(n * usdRate) : EUR.format(n));
};

/** Formate un prix (ex: 1 234,56 €) */
export const formatPrice = (n: number): string => {
  const { privacyMode, currency, usdRate } = useSettingsStore.getState();
  if (privacyMode) return "****";

  return currency === "USD" && usdRate !== null
    ? NUMBER_US.format(n * usdRate) + " $"
    : visibleSpaces(NUMBER_FR.format(n)) + " €";
};

/** Cours d'un titre, ou niveau d'un indice (ticker "^…") : un indice se compte en points, pas en euros */
export const formatQuote = (n: number, ticker: string): string =>
  ticker.startsWith("^") ? `${visibleSpaces(NUMBER_FR.format(n))} pts` : formatPrice(n);

/** Formate un ratio en pourcentage (ex: 12,34 %) */
export const formatPercent = (n: number): string => visibleSpaces(PERCENT.format(n));

/** Helper pour extraire la géographie d'un ticker */
export const getGeography = (ticker: string): string => {
  if (ticker.endsWith(".PA")) return "France";
  if (ticker.endsWith(".AS")) return "Pays-Bas";
  if (ticker.endsWith(".DE")) return "Allemagne";
  if (ticker.endsWith(".MI")) return "Italie";
  if (ticker.endsWith(".MC")) return "Espagne";
  if (ticker.endsWith(".BR")) return "Belgique";
  if (ticker.endsWith(".LS")) return "Portugal";
  if (ticker.endsWith(".HE")) return "Finlande";
  if (ticker.endsWith(".L")) return "Royaume-Uni";
  if (!ticker.includes(".")) return "États-Unis"; // AAPL, MSFT...
  return "Autre";
};

// ─── Couleurs des graphiques ─────────────────────────────────────────────────

/** Palette de couleurs Violet / Fuchsia utilisée dans tous les PieChart / BarChart. */
export const CHART_COLORS = [
  "#8b5cf6", // violet-500
  "#d946ef", // fuchsia-500
  "#6366f1", // indigo-500
  "#a855f7", // purple-500
  "#fafafa", // white
  "#71717a", // zinc-500
  "#3f3f46", // zinc-700
];

// ─── Style partagé pour Tooltip des graphiques ───────────────────────────────

/** Objet de style Recharts réutilisable pour tous les tooltips. */
export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#09090b",
    border: "1px solid #27272a",
    borderRadius: "12px",
    fontSize: "13px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  },
  itemStyle: { color: "#fafafa" },
  labelStyle: { color: "#a1a1aa" },
};
