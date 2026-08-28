"use client";

import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { generateFiscalReportPDF } from "@/lib/pdf-report";
import type { EnrichedPortfolioPosition } from "@/hooks/usePortfolio";

interface TaxSimulatorProps {
  totalCapital: number;
  totalPlusValue: number;
  totalInvested?: number;
  totalDividends?: number;
  cashBalance?: number;
  positions?: EnrichedPortfolioPosition[];
}

export default function TaxSimulator({
  totalCapital,
  totalPlusValue,
  totalInvested = 0,
  totalDividends = 0,
  cashBalance = 0,
  positions = [],
}: TaxSimulatorProps) {
  const [amountToWithdraw, setAmountToWithdraw] =
    useState<number>(totalCapital);
  const [isExporting, setIsExporting] = useState(false);

  // PEA rules: Prélèvements Sociaux (17.2%) on the share of Plus-Value proportional to withdrawal
  const withdrawalRatio =
    totalCapital > 0 ? amountToWithdraw / totalCapital : 0;
  const taxablePlusValue = Math.max(0, totalPlusValue * withdrawalRatio);
  const taxes = taxablePlusValue * 0.172;
  const netAmount = amountToWithdraw - taxes;

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      generateFiscalReportPDF({
        totalValue: totalCapital,
        totalInvested: totalInvested || Math.max(0, totalCapital - totalPlusValue),
        totalPV: totalPlusValue,
        totalDividends,
        cashBalance,
        positions,
      });
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black p-6 backdrop-blur-sm shadow-[0_0_15px_rgba(139,92,246,0.06)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">
            Simulateur de fiscalité & Retrait PEA
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Régime PEA après 5 ans : 0% IR • 17.2% Prélèvements Sociaux sur la quote-part de gain
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 transition-all hover:from-violet-700 hover:to-fuchsia-700 active:scale-95 disabled:opacity-50"
        >
          <FileText className="h-4 w-4" />
          <span>{isExporting ? "Génération..." : "Rapport Fiscal PDF"}</span>
          <Download className="h-3.5 w-3.5 opacity-80" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Montant du Retrait (€)
          </label>
          <input
            type="number"
            min="0"
            max={totalCapital}
            value={amountToWithdraw.toFixed(0)}
            onChange={(e) => setAmountToWithdraw(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Maximum possible :{" "}
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(totalCapital)}
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-zinc-900/60 border border-zinc-800 p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-400">Retrait brut souhaité</span>
            <span className="text-white font-medium">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(amountToWithdraw)}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-400">Assiette taxable estimée (Quote-part Plus-Value)</span>
            <span className="text-zinc-300">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(taxablePlusValue)}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-2 border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Prélèvements Sociaux (17.2%)</span>
            <span className="text-rose-400 font-semibold">
              -
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(taxes)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-2">
            <span className="text-white">Net perçu estimé</span>
            <span className="text-emerald-400">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(netAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
