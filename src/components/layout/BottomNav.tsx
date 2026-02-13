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
    { href: "/", label: "Accueil", icon: LayoutDashboard },
    { href: "/portefeuille", label: "Portefeuille", icon: Briefcase },
    { href: "/marche", label: "Marché", icon: TrendingUp },
    { href: "/transactions", label: "Historique", icon: ArrowLeftRight },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-zinc-800 bg-black/80 px-2 pb-safe backdrop-blur-xl md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-all active:scale-95 ${
              isActive ? "text-violet-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <item.icon
              className={`h-5 w-5 ${
                isActive ? "fill-current text-violet-400" : "text-zinc-500"
              }`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
