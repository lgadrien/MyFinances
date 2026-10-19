/**
 * src/components/ui/Skeleton.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Skeleton premium avec effet shimmer gradient animé.
 */

"use client";

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

/** Skeleton générique (pour graphiques, etc.) */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="stats-card-skeleton w-full rounded-2xl"
      style={{ height }}
    />
  );
}
