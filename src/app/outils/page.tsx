"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useSettingsStore } from "@/stores/useSettingsStore";

const TaxSimulator = dynamic(() => import("@/components/widgets/TaxSimulator"), {
  ssr: false,
  loading: () => <ChartSkeleton height={200} />,
});
const DCASimulator = dynamic(() => import("@/components/widgets/DCASimulator"), {
  ssr: false,
  loading: () => <ChartSkeleton height={320} />,
});

export default function OutilsPage() {
  useSettingsStore();
  const {
    positions,
    loading,
    totalInvested,
    totalValue,
    totalPV,
    cashBalance,
    totalDividends,
    planGain,
    taxRate,
  } = usePortfolio();

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Outils
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Simulateurs de fiscalité PEA et d&apos;investissement programmé
        </p>
      </div>

      {/* Les simulateurs initialisent leurs champs au montage : on attend les données */}
      {loading ? (
        <>
          <ChartSkeleton height={200} />
          <ChartSkeleton height={320} />
        </>
      ) : (
        <>
          <TaxSimulator
            totalValue={totalValue}
            totalInvested={totalInvested}
            totalPV={totalPV}
            totalDividends={totalDividends}
            cashBalance={cashBalance}
            planGain={planGain}
            taxRate={taxRate}
            positions={positions}
          />
          <DCASimulator currentPortfolioValue={totalValue} />
        </>
      )}
    </div>
  );
}
