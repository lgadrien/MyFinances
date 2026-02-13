interface BadgeProps {
  variant: "success" | "danger" | "warning" | "info" | "neutral";
  children: React.ReactNode;
}

export default function Badge({ variant, children }: BadgeProps) {
  const variantStyles: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
