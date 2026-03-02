/**
 * src/lib/utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilitaires partagés entre toutes les pages et composants.
 * Importez depuis ici plutôt que de recréer les mêmes fonctions localement.
 */

// ─── Formatters monnaie / pourcentage ────────────────────────────────────────

/** Formate un nombre en euros (ex: 1 234,56 €) */
export const formatEUR = (n: number): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

/** Formate un prix sans le symbole €, avec 2 décimales (ex: 1 234,56 €) */
export const formatPrice = (n: number): string =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + " €";

/** Formate un ratio en pourcentage (ex: 12,34 %) */
export const formatPercent = (n: number): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

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
