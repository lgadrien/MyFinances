interface BadgeProps {
  variant: "success" | "danger" | "warning" | "info" | "neutral";
  children: React.ReactNode;
}

export default function Badge({ variant, children }: BadgeProps) {
  const variantStyles: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    neutral: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
