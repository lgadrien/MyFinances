import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  accentColor?: string;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  accentColor = "emerald",
}: StatsCardProps) {
  const colorMap: Record<string, { bg: string; icon: string; shadow: string }> =
    {
      emerald: {
        bg: "from-emerald-500/10 to-emerald-600/5",
        icon: "text-emerald-400",
        shadow: "shadow-emerald-500/5",
      },
      blue: {
        bg: "from-blue-500/10 to-blue-600/5",
        icon: "text-blue-400",
        shadow: "shadow-blue-500/5",
      },
      purple: {
        bg: "from-purple-500/10 to-purple-600/5",
        icon: "text-purple-400",
        shadow: "shadow-purple-500/5",
      },
      amber: {
        bg: "from-amber-500/10 to-amber-600/5",
        icon: "text-amber-400",
        shadow: "shadow-amber-500/5",
      },
      violet: {
        bg: "from-violet-500/10 to-violet-600/5",
        icon: "text-violet-400",
        shadow: "shadow-violet-500/5",
      },
      fuchsia: {
        bg: "from-fuchsia-500/10 to-fuchsia-600/5",
        icon: "text-fuchsia-400",
        shadow: "shadow-fuchsia-500/5",
      },
    };

  const colors = colorMap[accentColor] || colorMap.emerald;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br ${colors.bg} p-5 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:shadow-lg ${colors.shadow}`}
    >
      {/* Glow effect */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-white/[0.03] to-transparent" />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-white">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={`text-xs font-semibold ${
                  trend.positive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {trend.positive ? "↑" : "↓"} {trend.value}
              </span>
            </div>
          )}
        </div>
        <div className="rounded-xl bg-zinc-800/40 p-3">
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}
