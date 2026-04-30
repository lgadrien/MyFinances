/**
 * src/lib/utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilitaires partagés entre toutes les pages et composants.
 * Importez depuis ici plutôt que de recréer les mêmes fonctions localement.
 */

// ─── Formatters monnaie / pourcentage ────────────────────────────────────────

import { useSettingsStore } from "@/stores/useSettingsStore";

/** Formate un nombre avec devise et gère le mode Privacy */
export const formatEUR = (n: number): string => {
  const { privacyMode, currency } = useSettingsStore.getState();
  if (privacyMode) return "****";

  const rate = currency === "USD" ? 1.08 : 1; // Taux fixe simple pour la démo
  const val = n * rate;

  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "fr-FR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

/** Formate un prix (ex: 1 234,56 €) */
export const formatPrice = (n: number): string => {
  const { privacyMode, currency } = useSettingsStore.getState();
  if (privacyMode) return "****";

  const rate = currency === "USD" ? 1.08 : 1;
  const val = n * rate;

  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val) + (currency === "USD" ? " $" : " €");
};

/** Formate un ratio en pourcentage (ex: 12,34 %) */
export const formatPercent = (n: number): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

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

// ─── Rendu du label personnalisé pour PieChart ───────────────────────────────

interface CustomLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

/**
 * Label affiché à l'intérieur des tranches de PieChart.
 * Masqué automatiquement si la tranche représente moins de 5 % du total.
 */
export const renderCustomizedLabel = ({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
}: CustomLabelProps) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="11"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

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
