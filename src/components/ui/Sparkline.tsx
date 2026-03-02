/**
 * src/components/ui/Sparkline.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Mini graphique sparkline en SVG natif (0 dépendance, ~2KB compressé).
 * Utilisé dans les tableaux de positions pour afficher la tendance des prix.
 *
 * Props :
 *   data    — tableau de nombres (prix)
 *   width   — largeur en px (défaut: 80)
 *   height  — hauteur en px (défaut: 32)
 *   color   — couleur de la ligne ("emerald" | "rose" | custom hex)
 */

"use client";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  className?: string;
}

export default function Sparkline({
  data,
  width = 80,
  height = 32,
  positive,
  className = "",
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  // Calcule les coordonnées SVG de chaque point
  const points = data.map((val, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + h - ((val - min) / range) * h;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");

  // Derive automatiquement la couleur depuis la première et dernière valeur
  const isPositive = positive ?? data[data.length - 1] >= data[0];
  const stroke = isPositive ? "#34d399" : "#f87171"; // emerald-400 / rose-400
  const gradId = `spark-${Math.random().toString(36).slice(2, 9)}`;

  // Points pour le fill (chemin fermé)
  const firstX = pad;
  const lastX = pad + w;
  const bottomY = pad + h + 2;
  const fillPath = `M${firstX},${bottomY} L${points.join(" L")} L${lastX},${bottomY} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Zone de remplissage sous la courbe */}
      <path d={fillPath} fill={`url(#${gradId})`} />

      {/* Ligne principale */}
      <polyline
        points={polyline}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Point final (prix actuel) */}
      <circle
        cx={points[points.length - 1].split(",")[0]}
        cy={points[points.length - 1].split(",")[1]}
        r={2}
        fill={stroke}
      />
    </svg>
  );
}
