"use client";

import { useState } from "react";

export default function TaxSimulator({
  totalCapital,
  totalPlusValue,
}: {
  totalCapital: number;
  totalPlusValue: number;
}) {
  const [amountToWithdraw, setAmountToWithdraw] =
    useState<number>(totalCapital);

  // PEA rules: Prélèvements Sociaux (17.2%) on the share of Plus-Value proportional to withdrawal
  const withdrawalRatio =
    totalCapital > 0 ? amountToWithdraw / totalCapital : 0;
  const taxablePlusValue = Math.max(0, totalPlusValue * withdrawalRatio);
  const taxes = taxablePlusValue * 0.172;
  const netAmount = amountToWithdraw - taxes;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-white dark:from-zinc-900/50 to-zinc-50 dark:to-black p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">
        Simulateur de fiscalité & Retrait PEA
      </h2>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Montant du Retrait (€)
          </label>
          <input
            type="number"
            min="0"
            max={totalCapital}
            value={amountToWithdraw.toFixed(0)}
            onChange={(e) => setAmountToWithdraw(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-violet-500"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Maximum possible :{" "}
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(totalCapital)}
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-white dark:bg-zinc-800/50 p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-600 dark:text-zinc-400">Retrait brut</span>
            <span className="text-zinc-900 dark:text-white">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(amountToWithdraw)}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-600 dark:text-zinc-400">Assiette taxable estimée (PV)</span>
            <span className="text-zinc-700 dark:text-zinc-300">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(taxablePlusValue)}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-2 border-b border-zinc-200 dark:border-zinc-700 pb-2">
            <span className="text-zinc-600 dark:text-zinc-400">Prélèvements Sociaux (17.2%)</span>
            <span className="text-rose-400">
              -
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(taxes)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-2">
            <span className="text-zinc-900 dark:text-white">Net perçu</span>
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
