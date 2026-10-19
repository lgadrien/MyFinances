"use client";

import { useState } from "react";
import { FileText, Download } from "lucide-react";
import type { FiscalReportData } from "@/lib/pdf-report";
import { formatEUR } from "@/lib/utils";

export default function TaxSimulator(props: FiscalReportData) {
  const { totalValue, cashBalance, planGain, taxRate } = props;
  const totalCapital = totalValue + cashBalance;
  const [amountToWithdraw, setAmountToWithdraw] =
    useState<number>(totalCapital);
  const [isExporting, setIsExporting] = useState(false);

  // PEA: the plan's gain is taxed pro rata of the withdrawal over the plan value (shares + cash)
  const withdrawal = Math.min(Math.max(0, amountToWithdraw), totalCapital);
  const withdrawalRatio = totalCapital > 0 ? withdrawal / totalCapital : 0;
  const taxablePlusValue = Math.max(0, planGain) * withdrawalRatio;
  const taxes = taxablePlusValue * taxRate;
  const netAmount = withdrawal - taxes;

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // jsPDF (~140 KB gzip) is only loaded when the report is requested
      const { generateFiscalReportPDF } = await import("@/lib/pdf-report");
      generateFiscalReportPDF(props);
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-black p-6 shadow-[0_0_15px_rgba(139,92,246,0.06)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">
            Simulateur de fiscalité & Retrait PEA
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            18,6 % de prélèvements sociaux sur la quote-part de gain • avant 5 ans, le retrait clôture le plan et ajoute 12,8 % d&apos;IR
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
            value={withdrawal.toFixed(0)}
            onChange={(e) => setAmountToWithdraw(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Maximum possible (titres + espèces) : {formatEUR(totalCapital)}
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-zinc-900/60 border border-zinc-800 p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-400">Retrait brut souhaité</span>
            <span className="text-white font-medium">
              {formatEUR(withdrawal)}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-400">Assiette taxable estimée (quote-part du gain du plan)</span>
            <span className="text-zinc-300">
              {formatEUR(taxablePlusValue)}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-2 border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">
              Impôt et prélèvements sociaux ({(taxRate * 100).toLocaleString("fr-FR")} %)
            </span>
            <span className="text-rose-400 font-semibold">
              {taxes > 0 ? "-" : ""}
              {formatEUR(taxes)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-2">
            <span className="text-white">Net perçu estimé</span>
            <span className="text-emerald-400">
              {formatEUR(netAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
