"use client";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { Eye, EyeOff, DollarSign, Euro, LogOut, MoreVertical } from "lucide-react";

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  // Full reload drops every cached query; replace keeps the protected page out of history
  window.location.replace("/login");
}

export default function GlobalSettingsToggles({
  isCollapsed = false,
  horizontal = false,
}: {
  isCollapsed?: boolean;
  horizontal?: boolean;
}) {
  const { privacyMode, togglePrivacyMode, currency, setCurrency } =
    useSettingsStore();

  if (horizontal) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={togglePrivacyMode}
          className={`rounded-lg p-2 transition-colors ${
            privacyMode ? "bg-zinc-800 text-violet-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
          title="Mode Discret"
        >
          {privacyMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
        <button
          onClick={() => setCurrency(currency === "EUR" ? "USD" : "EUR")}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          title="Changer de devise"
        >
          {currency === "EUR" ? <Euro className="h-5 w-5 text-violet-400" /> : <DollarSign className="h-5 w-5 text-green-400" />}
        </button>
        {/* Logout lives in a menu so a mis-tap next to the currency toggle can't sign the user out */}
        <details className="relative">
          <summary
            aria-label="Plus d'options"
            className="cursor-pointer list-none rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white [&::-webkit-details-marker]:hidden"
          >
            <MoreVertical className="h-5 w-5" />
          </summary>
          <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-xl">
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>
        </details>
      </div>
    );
  }

  return (
    <div
      className={`mt-auto flex flex-col gap-2 border-t border-zinc-800 p-4 transition-all duration-300 ${
        isCollapsed ? "items-center" : ""
      }`}
    >
      <button
        onClick={togglePrivacyMode}
        className={`group flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200 hover:bg-zinc-900 ${
          isCollapsed ? "justify-center px-0 w-full" : "gap-3 px-3"
        } ${privacyMode ? "text-violet-400" : "text-zinc-500"}`}
        title="Mode Discret"
      >
        {privacyMode ? (
          <EyeOff className="h-5 w-5 shrink-0" />
        ) : (
          <Eye className="h-5 w-5 shrink-0" />
        )}
        {!isCollapsed && <span>Mode Discret</span>}
      </button>

      <button
        onClick={() => setCurrency(currency === "EUR" ? "USD" : "EUR")}
        className={`group flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200 hover:bg-zinc-900 ${
          isCollapsed ? "justify-center px-0 w-full" : "gap-3 px-3"
        } text-zinc-500`}
        title="Changer de devise"
      >
        {currency === "EUR" ? (
          <Euro className="h-5 w-5 shrink-0 text-violet-400" />
        ) : (
          <DollarSign className="h-5 w-5 shrink-0 text-green-400" />
        )}
        {!isCollapsed && <span>Devise ({currency})</span>}
      </button>

      <button
        onClick={logout}
        className={`group flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200 hover:bg-zinc-900 ${
          isCollapsed ? "justify-center px-0 w-full" : "gap-3 px-3"
        } text-zinc-500`}
        title="Se déconnecter"
      >
        <LogOut className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span>Déconnexion</span>}
      </button>
    </div>
  );
}
