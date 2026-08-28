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
  Bell,
} from "lucide-react";
import GlobalSettingsToggles from "./GlobalSettingsToggles";
import { useAlerts } from "@/hooks/useAlerts";

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
  onOpenAlerts?: () => void;
}

export default function Sidebar({
  className = "",
  onNavigate,
  isCollapsed = false,
  onToggle,
  onOpenAlerts,
}: SidebarProps) {
  const pathname = usePathname();
  const { unreadCount, alerts } = useAlerts();

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
      {/* Logo */}
      <div
        className={`flex h-16 items-center border-b border-zinc-800 transition-all duration-300 ${
          isCollapsed ? "justify-center px-0" : "gap-3 px-6"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap transition-all duration-300">
            <h1 className="text-lg font-bold text-white">MyFinances</h1>
            <p className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-[10px] font-medium uppercase tracking-widest text-transparent">
              PEA Tracker
            </p>
          </div>
        )}
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

        {/* Alerts Center Trigger Button */}
        {onOpenAlerts && (
          <button
            onClick={onOpenAlerts}
            className={`group flex w-full items-center rounded-xl py-3 text-sm font-medium text-zinc-500 transition-all duration-200 hover:bg-zinc-900 hover:text-zinc-200 ${
              isCollapsed ? "justify-center px-0 mx-2" : "gap-3 px-4"
            }`}
            title={isCollapsed ? "Alertes" : undefined}
          >
            <div className="relative">
              <Bell className={`shrink-0 ${isCollapsed ? "h-6 w-6" : "h-5 w-5"}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white ring-2 ring-black">
                  {unreadCount}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <>
                <span className="whitespace-nowrap">Alertes</span>
                {alerts.length > 0 && (
                  <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                    {alerts.length}
                  </span>
                )}
              </>
            )}
          </button>
        )}
      </nav>

      <GlobalSettingsToggles isCollapsed={isCollapsed} />
    </aside>
  );
}
