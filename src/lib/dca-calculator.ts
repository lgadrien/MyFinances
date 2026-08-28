/**
 * src/lib/dca-calculator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Dollar-Cost Averaging (DCA) and Compound Interest Projection Engine.
 * Simulates portfolio value over time with recurring deposits and dividend reinvestment.
 */

export interface DCAParams {
  initialCapital: number; // e.g. 5000 €
  monthlyContribution: number; // e.g. 300 € / month
  years: number; // e.g. 10 years
  annualGrowthRate: number; // e.g. 0.06 (6% stock growth)
  dividendYieldRate?: number; // e.g. 0.025 (2.5% dividend yield)
}

export interface DCAMilestone {
  year: number;
  totalContributed: number;
  totalGains: number;
  totalDividends: number;
  totalValue: number;
}

export interface DCAResult {
  finalValue: number;
  totalContributed: number;
  totalGains: number;
  totalDividends: number;
  milestones: DCAMilestone[];
  monthlyData: { month: number; year: number; contributed: number; value: number }[];
}

export function calculateDCASimulation({
  initialCapital,
  monthlyContribution,
  years,
  annualGrowthRate,
  dividendYieldRate = 0.02,
}: DCAParams): DCAResult {
  const safeInitial = Math.max(0, initialCapital);
  const safeMonthly = Math.max(0, monthlyContribution);
  const safeYears = Math.min(40, Math.max(1, years));

  const totalAnnualRate = annualGrowthRate + dividendYieldRate;
  const monthlyRate = Math.pow(1 + totalAnnualRate, 1 / 12) - 1;
  const monthlyGrowthOnly = Math.pow(1 + annualGrowthRate, 1 / 12) - 1;
  const monthlyDivOnly = monthlyRate - monthlyGrowthOnly;

  let currentValue = safeInitial;
  let totalContributed = safeInitial;
  let cumulativeDividends = 0;

  const milestones: DCAMilestone[] = [];
  const monthlyData: DCAResult["monthlyData"] = [];

  // Year 0 milestone
  milestones.push({
    year: 0,
    totalContributed: safeInitial,
    totalGains: 0,
    totalDividends: 0,
    totalValue: safeInitial,
  });

  const totalMonths = safeYears * 12;

  for (let m = 1; m <= totalMonths; m++) {
    // Deposit at beginning of month
    currentValue += safeMonthly;
    totalContributed += safeMonthly;

    // Monthly returns
    const monthlyDivAmount = currentValue * monthlyDivOnly;
    cumulativeDividends += monthlyDivAmount;

    currentValue = currentValue * (1 + monthlyRate);

    const currentYear = Math.floor(m / 12);
    const isYearEnd = m % 12 === 0;

    monthlyData.push({
      month: m,
      year: Number((m / 12).toFixed(1)),
      contributed: Math.round(totalContributed),
      value: Math.round(currentValue),
    });

    if (isYearEnd) {
      const totalGains = Math.max(0, currentValue - totalContributed);
      milestones.push({
        year: currentYear,
        totalContributed: Math.round(totalContributed),
        totalGains: Math.round(totalGains),
        totalDividends: Math.round(cumulativeDividends),
        totalValue: Math.round(currentValue),
      });
    }
  }

  const finalValue = Math.round(currentValue);
  const totalGains = Math.max(0, finalValue - Math.round(totalContributed));

  return {
    finalValue,
    totalContributed: Math.round(totalContributed),
    totalGains,
    totalDividends: Math.round(cumulativeDividends),
    milestones,
    monthlyData,
  };
}
