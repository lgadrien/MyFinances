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
import GlobalSettingsToggles from "./GlobalSettingsToggles";
import { useSettingsStore, Environment } from "@/stores/useSettingsStore";
import { useState, useRef, useEffect } from "react";

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
  const { environment, setEnvironment } = useSettingsStore();
  const [isEnvDropdownOpen, setIsEnvDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEnvDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEnvChange = (env: Environment) => {
    setEnvironment(env);
    setIsEnvDropdownOpen(false);
  };

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
        ref={dropdownRef}
        className={`relative flex h-16 items-center border-b border-zinc-800 transition-all duration-300 ${
          isCollapsed ? "justify-center px-0" : "gap-3 px-6"
        }`}
      >
        <button
          onClick={() => !isCollapsed && setIsEnvDropdownOpen(!isEnvDropdownOpen)}
          className={`flex w-full items-center gap-3 rounded-xl transition-all ${
            !isCollapsed ? "hover:bg-zinc-900 p-1 -ml-1" : ""
          }`}
          title={isCollapsed ? environment : undefined}
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-lg ${
            environment === "PEA" 
              ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-violet-500/20" 
              : "bg-gradient-to-br from-yellow-500 to-orange-500 shadow-yellow-500/20"
          }`}>
            {environment === "PEA" ? (
              <Wallet className="h-5 w-5 text-white" />
            ) : (
              <Bitcoin className="h-5 w-5 text-white" />
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap transition-all duration-300">
              <div className="text-left">
                <h1 className="text-lg font-bold text-white">MyFinances</h1>
                <p className={`bg-clip-text text-[10px] font-medium uppercase tracking-widest text-transparent ${
                  environment === "PEA"
                    ? "bg-gradient-to-r from-violet-400 to-fuchsia-400"
                    : "bg-gradient-to-r from-yellow-400 to-orange-400"
                }`}>
                  {environment} Tracker
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${isEnvDropdownOpen ? "rotate-180" : ""}`} />
            </div>
          )}
        </button>

        {/* Dropdown Menu */}
        {isEnvDropdownOpen && !isCollapsed && (
          <div className="absolute left-4 right-4 top-14 z-50 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-xl">
            <button
              onClick={() => handleEnvChange("PEA")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                environment === "PEA" ? "bg-violet-500/10 text-violet-400" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Wallet className="h-4 w-4" />
              PEA Tracker
            </button>
            <button
              onClick={() => handleEnvChange("BINANCE")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                environment === "BINANCE" ? "bg-yellow-500/10 text-yellow-400" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Bitcoin className="h-4 w-4" />
              Binance Tracker
            </button>
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
      </nav>

      <GlobalSettingsToggles isCollapsed={isCollapsed} />
    </aside>
  );
}
