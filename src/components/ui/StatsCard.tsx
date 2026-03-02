/**
 * src/components/ui/StatsCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Carte KPI avec :
 *   - Compteur animé (countUp) sur la valeur numérique
 *   - Stagger d'entrée via CSS delay (prop `index`)
 *   - Hover premium avec glow subtil
 *   - Badge trend animé
 */

"use client";

import { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

interface StatsCardProps {
  label: string;
  /** Valeur formatée à afficher (string si déjà formatée, ou number pour countUp) */
  value: string;
  /** Valeur numérique brute pour animer le countUp (optionnel) */
  rawValue?: number;
  /** Callback de formatage de la valeur animée (ex: formatEUR) */
  formatValue?: (n: number) => string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  accentColor?: string;
  /** Position dans la grille (0-based) pour l'effet stagger */
  index?: number;
}

const colorMap: Record<
  string,
  { bg: string; icon: string; glow: string; iconBg: string }
> = {
  emerald: {
    bg: "from-emerald-500/10 to-emerald-600/5",
    icon: "text-emerald-400",
    glow: "hover:shadow-emerald-500/10",
    iconBg: "bg-emerald-500/10",
  },
  blue: {
    bg: "from-blue-500/10 to-blue-600/5",
    icon: "text-blue-400",
    glow: "hover:shadow-blue-500/10",
    iconBg: "bg-blue-500/10",
  },
  purple: {
    bg: "from-purple-500/10 to-purple-600/5",
    icon: "text-purple-400",
    glow: "hover:shadow-purple-500/10",
    iconBg: "bg-purple-500/10",
  },
  amber: {
    bg: "from-amber-500/10 to-amber-600/5",
    icon: "text-amber-400",
    glow: "hover:shadow-amber-500/10",
    iconBg: "bg-amber-500/10",
  },
  violet: {
    bg: "from-violet-500/10 to-violet-600/5",
    icon: "text-violet-400",
    glow: "hover:shadow-violet-500/20",
    iconBg: "bg-violet-500/10",
  },
  fuchsia: {
    bg: "from-fuchsia-500/10 to-fuchsia-600/5",
    icon: "text-fuchsia-400",
    glow: "hover:shadow-fuchsia-500/10",
    iconBg: "bg-fuchsia-500/10",
  },
};

export default function StatsCard({
  label,
  value,
  rawValue,
  formatValue,
  icon: Icon,
  trend,
  accentColor = "emerald",
  index = 0,
}: StatsCardProps) {
  const colors = colorMap[accentColor] || colorMap.emerald;

  // Compteur animé only quand rawValue est fourni
  const animated = useCountUp(rawValue ?? 0, {
    duration: 1000,
    delay: index * 120, // stagger : chaque carte démarre 120ms après la précédente
    skipSmallChanges: true,
  });

  const displayValue =
    rawValue !== undefined && formatValue ? formatValue(animated) : value;

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border border-zinc-800/80
        bg-gradient-to-br ${colors.bg}
        p-5 backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:-translate-y-0.5 hover:border-zinc-700/60
        hover:shadow-xl ${colors.glow}
      `}
      style={{
        animationDelay: `${index * 80}ms`,
        animation: "statsCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      {/* Glow orbe top-right */}
      <div
        className={`
          absolute -right-6 -top-6 h-28 w-28 rounded-full
          bg-gradient-to-br ${colors.bg} opacity-50
          blur-2xl transition-opacity duration-300 group-hover:opacity-80
        `}
      />

      {/* Ligne d'accent en bas */}
      <div
        className={`
          absolute bottom-0 left-0 h-[2px] w-0 rounded-full
          bg-gradient-to-r ${colors.bg.replace("from-", "from-").replace("/10", "/60").replace("/5", "/40")}
          transition-all duration-500 group-hover:w-full
        `}
      />

      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5 min-w-0 flex-1 pr-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            {label}
          </p>
          <p className="truncate text-2xl font-bold tracking-tight text-white tabular-nums">
            {displayValue}
          </p>
          {trend && (
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold
                  ${
                    trend.positive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
              >
                {trend.positive ? "↑" : "↓"}
              </div>
              <span
                className={`text-xs font-semibold ${
                  trend.positive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {trend.value}
              </span>
            </div>
          )}
        </div>

        {/* Icône avec fond coloré */}
        <div
          className={`
            flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
            ${colors.iconBg} ring-1 ring-white/5
            transition-transform duration-300 group-hover:scale-110
          `}
        >
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}
