"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  ArrowLeftRight,
  Wallet,
  Briefcase,
  ChevronLeft,
  Bitcoin,
  ChevronDown,
} from "lucide-react";
import EnvSwitcher from "./EnvSwitcher";
import GlobalSettingsToggles from "./GlobalSettingsToggles";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portefeuille", label: "Portefeuille", icon: Briefcase },
  { href: "/marche", label: "Marché", icon: TrendingUp },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({
  className = "",
  onNavigate,
  isCollapsed = false,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex h-screen flex-col border-r border-zinc-800 bg-black backdrop-blur-xl transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      } ${className}`}
    >
      {/* Toggle Button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:text-white"
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform duration-300 ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
      {/* Logo & Environment Switcher */}
      <div
        className={`relative flex h-16 items-center border-b border-zinc-800 transition-all duration-300 ${
          isCollapsed ? "justify-center px-0" : "gap-3 px-6"
        }`}
      >
        <EnvSwitcher isCollapsed={isCollapsed} />
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
              className={`group flex items-center rounded-xl py-3 text-sm font-medium transition-all duration-200 ${
                isCollapsed ? "justify-center px-0 mx-2" : "gap-3 px-4"
              } ${
                isActive
                  ? "bg-violet-500/10 text-violet-400 shadow-sm shadow-violet-500/5 ring-1 ring-violet-500/20"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon
                className={`shrink-0 transition-colors ${
                  isCollapsed ? "h-6 w-6" : "h-5 w-5"
                } ${
                  isActive
                    ? "text-violet-400"
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              {!isCollapsed && (
                <>
                  <span className="whitespace-nowrap">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400 shadow-sm shadow-violet-400/50" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <GlobalSettingsToggles isCollapsed={isCollapsed} />
    </aside>
  );
}
