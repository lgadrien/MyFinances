"use client";

import { useSettingsStore, Environment } from "@/stores/useSettingsStore";
import { Wallet, Bitcoin, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function EnvSwitcher({
  mobile = false,
  isCollapsed = false,
}: {
  mobile?: boolean;
  isCollapsed?: boolean;
}) {
  const { environment, setEnvironment } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEnvChange = (env: Environment) => {
    setEnvironment(env);
    setIsOpen(false);
  };

  if (mobile) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 transition-all active:scale-95 ${
            environment === "PEA" ? "text-violet-400" : "text-yellow-400"
          }`}
        >
          {environment === "PEA" ? (
            <Wallet className="h-4 w-4" />
          ) : (
            <Bitcoin className="h-4 w-4" />
          )}
          <span className="text-sm font-bold text-white">{environment}</span>
          <ChevronDown className={`h-3 w-3 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => handleEnvChange("PEA")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                environment === "PEA" ? "bg-violet-500/10 text-violet-400" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              <Wallet className="h-4 w-4" />
              PEA Tracker
            </button>
            <button
              onClick={() => handleEnvChange("BINANCE")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                environment === "BINANCE" ? "bg-yellow-500/10 text-yellow-400" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              <Bitcoin className="h-4 w-4" />
              Binance Tracker
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => !isCollapsed && setIsOpen(!isOpen)}
        className={`flex w-full items-center gap-3 rounded-xl transition-all ${
          !isCollapsed ? "hover:bg-zinc-900 p-1 -ml-1" : ""
        }`}
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
            <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>
        )}
      </button>

      {isOpen && !isCollapsed && (
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
  );
}
