/**
 * src/components/ui/Skeleton.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Skeleton premium avec effet shimmer gradient animé.
 * Utilisation identique au composant précédent + variantes prédéfinies.
 */

"use client";

/** Skeleton de base — remplace le simple animate-pulse */
export default function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`stats-card-skeleton ${className || ""}`} {...props} />
  );
}

/** Skeleton d'une StatsCard complète */
export function StatsCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1 pr-3">
          <div className="stats-card-skeleton h-2.5 w-20 rounded-full" />
          <div className="stats-card-skeleton h-7 w-32 rounded-lg" />
          <div className="stats-card-skeleton h-3 w-16 rounded-full" />
        </div>
        <div className="stats-card-skeleton h-11 w-11 rounded-xl" />
      </div>
    </div>
  );
}

/** Skeleton d'une ligne de tableau */
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div
            className="stats-card-skeleton h-4 rounded-md"
            style={{ width: `${60 + Math.random() * 30}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

/** Skeleton d'une carte mobile */
export function MobileCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="stats-card-skeleton h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <div className="stats-card-skeleton h-4 w-28 rounded-md" />
            <div className="stats-card-skeleton h-3 w-16 rounded-md" />
          </div>
        </div>
        <div className="text-right space-y-1.5">
          <div className="stats-card-skeleton h-4 w-20 rounded-md" />
          <div className="stats-card-skeleton h-3 w-14 rounded-md" />
        </div>
      </div>
      <div className="border-t border-zinc-800/50 pt-3 flex justify-between">
        <div className="stats-card-skeleton h-3 w-16 rounded-md" />
        <div className="stats-card-skeleton h-4 w-4 rounded-full" />
      </div>
    </div>
  );
}

/** Skeleton générique (pour graphiques, etc.) */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="stats-card-skeleton w-full rounded-2xl"
      style={{ height }}
    />
  );
}
