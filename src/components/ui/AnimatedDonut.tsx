/**
 * src/components/ui/AnimatedDonut.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Donut SVG natif — aucune dépendance Recharts.
 * Animation CSS keyframes pure (sliceIn) → toujours fluide, aucun délai de mesure.
 *
 * Features :
 *   - Animation d'entrée en stagger (chaque tranche après l'autre)
 *   - Hover : tranche active scale(1.05) + glow, autres à 40% opacité
 *   - Centre dynamique : label + montant changent au hover d'une tranche
 *   - Légende interactive cliquable
 */

"use client";

import { useState } from "react";
import { CHART_COLORS, formatEUR } from "@/lib/utils";

interface DonutSlice {
  name: string;
  value: number;
  percent?: number;
}

interface AnimatedDonutProps {
  data: DonutSlice[];
  height?: number;
  totalValue?: number;
  totalLabel?: string;
  showLegend?: boolean;
}

// ─── Calcul géométrique ────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  // Cap à 359.99° pour éviter le bug du cercle complet (start === end)
  const safeEnd = Math.min(endAngle, startAngle + 359.99);
  const large = safeEnd - startAngle > 180 ? 1 : 0;

  const oStart = polarToCartesian(cx, cy, outerR, safeEnd);
  const oEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const iStart = polarToCartesian(cx, cy, innerR, safeEnd);
  const iEnd = polarToCartesian(cx, cy, innerR, startAngle);

  return [
    `M ${oStart.x} ${oStart.y}`,
    `A ${outerR} ${outerR} 0 ${large} 0 ${oEnd.x} ${oEnd.y}`,
    `L ${iEnd.x} ${iEnd.y}`,
    `A ${innerR} ${innerR} 0 ${large} 1 ${iStart.x} ${iStart.y}`,
    "Z",
  ].join(" ");
}

// ─── Composant ────────────────────────────────────────────────────────

export default function AnimatedDonut({
  data,
  height = 300,
  totalValue,
  totalLabel = "Total",
  showLegend = true,
}: AnimatedDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Dimensions SVG fixes (pas de ResponsiveContainer → pas de délai de mesure)
  const svgSize = Math.min(height - (showLegend ? 72 : 0), 240);
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const outerR = svgSize / 2 - 8;
  const innerR = outerR * 0.6;
  const gap = 2; // espace en degrés entre tranches

  const total = data.reduce((s, d) => s + d.value, 0);

  // Construction des segments avec angles
  let cursor = 0;
  const segments = data.map((d, i) => {
    const sweep = total > 0 ? (d.value / total) * 360 : 0;
    // Réduction par le gap pour simuler l'espacement
    const start = cursor + gap / 2;
    const end = cursor + sweep - gap / 2;
    cursor += sweep;
    return {
      ...d,
      startAngle: start,
      endAngle: Math.max(end, start + 0.1), // tranche min visible
      color: CHART_COLORS[i % CHART_COLORS.length],
      index: i,
    };
  });

  const displayValue =
    activeIndex !== null
      ? (data[activeIndex]?.value ?? 0)
      : (totalValue ?? total);
  const displayLabel =
    activeIndex !== null ? (data[activeIndex]?.name ?? totalLabel) : totalLabel;

  if (!data.length) return null;

  return (
    <div style={{ height }} className="flex flex-col items-center">
      {/* ── SVG Donut ───────────────────────────────────────── */}
      <div
        className="relative flex-shrink-0"
        style={{ width: svgSize, height: svgSize }}
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{ overflow: "visible" }}
        >
          {segments.map((seg, i) => {
            const path = describeArc(
              cx,
              cy,
              outerR,
              innerR,
              seg.startAngle,
              seg.endAngle,
            );
            const isActive = activeIndex === i;
            const isFaded = activeIndex !== null && !isActive;

            return (
              <g
                key={`${seg.name}-${i}`}
                style={{
                  transformOrigin: `${cx}px ${cy}px`,
                  // Animation d'entrée en stagger — CSS keyframe dans globals.css
                  animation: `donutSliceIn 550ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 75}ms both`,
                }}
              >
                <path
                  d={path}
                  fill={seg.color}
                  style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    transform: isActive ? "scale(1.06)" : "scale(1)",
                    opacity: isFaded ? 0.35 : 1,
                    transition:
                      "transform 180ms ease, opacity 180ms ease, filter 180ms ease",
                    cursor: "pointer",
                    filter: isActive
                      ? `drop-shadow(0 0 8px ${seg.color}99)`
                      : "none",
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* ── Centre dynamique ─────────────────────────────── */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="w-full text-center text-[9px] font-bold uppercase tracking-widest text-zinc-500 transition-all duration-200">
            {displayLabel}
          </p>
          <p className="w-full text-center text-[15px] font-bold tabular-nums text-white transition-all duration-200">
            {formatEUR(displayValue)}
          </p>
        </div>
      </div>

      {/* ── Légende ─────────────────────────────────────────── */}
      {showLegend && (
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-2">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="flex cursor-pointer items-center gap-1.5 transition-opacity duration-150"
              style={{
                opacity: activeIndex !== null && activeIndex !== i ? 0.4 : 1,
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="max-w-[90px] truncate text-[11px] text-zinc-400">
                {seg.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
