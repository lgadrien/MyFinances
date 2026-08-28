"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  ArrowLeftRight,
  Briefcase,
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portefeuille", label: "Portefeuille", icon: Briefcase },
    { href: "/marche", label: "Marché", icon: TrendingUp },
    { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-zinc-800/80 bg-black/90 px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.6rem)] backdrop-blur-xl md:hidden shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold transition-all duration-200 active:scale-90 ${
              isActive
                ? "text-violet-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {isActive && (
              <span className="absolute -top-2 h-1 w-8 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_8px_rgba(139,92,246,0.8)] animate-fade-in" />
            )}
            <item.icon
              className={`h-5 w-5 transition-transform duration-200 ${
                isActive
                  ? "text-violet-400 scale-110"
                  : "text-zinc-500"
              }`}
            />
            <span className="leading-tight tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
