/**
 * src/components/widgets/DividendCalendar.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Calendrier annuel des dividendes — 12 mois en grille.
 * Affiche pour chaque mois :
 *   - Dividendes effectivement reçus (vert)
 *   - Dividendes projetés (violet, pointillés)
 *   - Mois vides (gris)
 *
 * Props :
 *   receivedByMonth  — Map "YYYY-MM" → montant reçu (depuis les transactions)
 *   projectedByMonth — Map "YYYY-MM" → montant projeté (depuis useDashboard)
 */

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatEUR } from "@/lib/utils";

const MONTH_NAMES_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

interface DividendCalendarProps {
  receivedByMonth: Record<string, number>; // "YYYY-MM" → amount
  projectedByMonth: Record<string, number>; // "YYYY-MM" → projected amount
}

export default function DividendCalendar({
  receivedByMonth,
  projectedByMonth,
}: DividendCalendarProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const totalReceived = Object.entries(receivedByMonth)
    .filter(([m]) => m.startsWith(String(year)))
    .reduce((s, [, v]) => s + v, 0);
  const totalProjected = Object.entries(projectedByMonth)
    .filter(([m]) => m.startsWith(String(year)))
    .reduce((s, [, v]) => s + v, 0);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-black p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">
            Calendrier des Dividendes
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Reçus et projetés</p>
        </div>
        {/* Sélecteur d'année */}
        <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-2 py-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-sm font-semibold text-white tabular-nums">
            {year}
          </span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Total annuel */}
      <div className="mb-5 flex gap-4">
        <div className="flex-1 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">
            Reçus {year}
          </p>
          <p className="mt-0.5 text-base font-bold text-emerald-400 tabular-nums">
            {formatEUR(totalReceived)}
          </p>
        </div>
        <div className="flex-1 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/70">
            Projetés {year}
          </p>
          <p className="mt-0.5 text-base font-bold text-violet-400 tabular-nums">
            {formatEUR(totalProjected)}
          </p>
        </div>
      </div>

      {/* Grille 12 mois */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => {
          const monthKey = `${year}-${String(i + 1).padStart(2, "0")}`;
          const received = receivedByMonth[monthKey] ?? 0;
          const projected = projectedByMonth[monthKey] ?? 0;
          const isCurrentMonth = monthKey === currentMonth;
          const isPast = monthKey < currentMonth;
          const hasDividend = received > 0 || projected > 0;

          return (
            <div
              key={monthKey}
              className={`
                relative rounded-xl p-3 text-center transition-all duration-200
                ${
                  isCurrentMonth
                    ? "border border-violet-500/40 bg-violet-500/10 ring-1 ring-violet-500/20"
                    : "border border-zinc-800/60 bg-zinc-900/30 hover:border-zinc-700/60 hover:bg-zinc-800/30"
                }
              `}
            >
              {/* Nom du mois */}
              <p
                className={`text-xs font-semibold ${isCurrentMonth ? "text-violet-300" : "text-zinc-400"}`}
              >
                {MONTH_NAMES_FR[i]}
              </p>

              {/* Indicateurs */}
              <div className="mt-2 space-y-1">
                {received > 0 && (
                  <div className="group relative">
                    <div className="mx-auto h-1.5 rounded-full bg-emerald-500" />
                    <p className="mt-1 text-[10px] font-bold text-emerald-400 tabular-nums">
                      {formatEUR(received)}
                    </p>
                  </div>
                )}
                {projected > 0 && received === 0 && (
                  <div>
                    <div
                      className="mx-auto h-1.5 rounded-full bg-violet-500/60"
                      style={{
                        background:
                          "repeating-linear-gradient(90deg, #8b5cf6 0 4px, transparent 4px 7px)",
                      }}
                    />
                    <p className="mt-1 text-[10px] font-medium text-violet-400/80 tabular-nums">
                      ~{formatEUR(projected)}
                    </p>
                  </div>
                )}
                {!hasDividend && (
                  <div
                    className={`mx-auto mt-1 h-1 w-6 rounded-full ${isPast ? "bg-zinc-700" : "bg-zinc-800"}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-4 flex items-center gap-4 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-5 rounded-full bg-emerald-500" />
          Reçu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-5 rounded-full bg-violet-500/60" />
          Projeté
        </span>
      </div>
    </div>
  );
}
