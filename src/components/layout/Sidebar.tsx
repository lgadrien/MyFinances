"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  ArrowLeftRight,
  Wallet,
  Briefcase,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portefeuille", label: "Portefeuille", icon: Briefcase },
  { href: "/marche", label: "Marché", icon: TrendingUp },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export default function Sidebar({ className = "", onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex h-screen w-64 flex-col border-r border-zinc-800 bg-black backdrop-blur-xl ${className}`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">MyFinances</h1>
          <p className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-[10px] font-medium uppercase tracking-widest text-transparent">
            PEA Tracker
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-violet-500/10 text-violet-400 shadow-sm shadow-violet-500/5 ring-1 ring-violet-500/20"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              <item.icon
                className={`h-5 w-5 transition-colors ${
                  isActive
                    ? "text-violet-400"
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              {item.label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-4">
        <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black p-4">
          <p className="text-xs font-medium text-zinc-400">Portefeuille PEA</p>
          <p className="mt-1 text-[10px] text-zinc-600">
            Données via Yahoo Finance
          </p>
        </div>
      </div>
    </aside>
  );
}
