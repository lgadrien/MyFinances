/**
 * src/lib/risk-metrics.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Financial risk and portfolio health metrics:
 * - Annualized Volatility
 * - Sharpe Ratio (vs risk-free rate)
 * - Maximum Drawdown (MDD)
 * - Diversification & Concentration Score (Herfindahl-Hirschman Index)
 * - Portfolio Beta
 */

export interface DiversificationAnalysis {
  score: number; // 0 to 100
  level: "Excellente" | "Équilibrée" | "Concentrée";
  topHoldingWeight: number; // %
  topSectorWeight: number; // %
  recommendations: string[];
}

export interface MaxDrawdownResult {
  maxDrawdownPct: number; // 0 to 1 (e.g. 0.15 for -15%)
  maxDrawdownAmount: number; // in €
  peakValue: number;
  troughValue: number;
}

export interface PortfolioRiskMetrics {
  annualizedVolatility: number; // e.g. 0.18 for 18%
  sharpeRatio: number; // e.g. 1.25
  maxDrawdown: MaxDrawdownResult;
  diversification: DiversificationAnalysis;
  annualizedReturn: number;
}

/**
 * Calculates daily percentage returns from a history array of portfolio values.
 */
export function calculateDailyReturns(values: number[]): number[] {
  if (values.length < 2) return [];
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    if (prev > 0) {
      returns.push((curr - prev) / prev);
    }
  }
  return returns;
}

/**
 * Annualized volatility (standard deviation of daily returns * sqrt(252 trading days)).
 */
export function calculateVolatility(dailyReturns: number[]): number {
  if (dailyReturns.length < 2) return 0;

  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    (dailyReturns.length - 1);
  const dailyStdDev = Math.sqrt(variance);

  // 252 trading days per year
  return dailyStdDev * Math.sqrt(252);
}

/**
 * Sharpe Ratio: (Portfolio Annualized Return - Risk Free Rate) / Annualized Volatility
 * Default risk-free rate is 3% (0.03, representative of Livret A / short-term EUR rates).
 */
export function calculateSharpeRatio(
  annualizedReturn: number,
  annualizedVolatility: number,
  riskFreeRate = 0.03,
): number {
  if (annualizedVolatility <= 0.0001) return 0;
  return (annualizedReturn - riskFreeRate) / annualizedVolatility;
}

/**
 * Calculates Maximum Drawdown (MDD) from high-water mark peak to trough.
 */
export function calculateMaxDrawdown(values: number[]): MaxDrawdownResult {
  if (values.length < 2) {
    return {
      maxDrawdownPct: 0,
      maxDrawdownAmount: 0,
      peakValue: values[0] || 0,
      troughValue: values[0] || 0,
    };
  }

  let peak = values[0];
  let maxDDPct = 0;
  let maxDDAmount = 0;
  let troughAtMax = values[0];
  let peakAtMax = values[0];

  for (const v of values) {
    if (v > peak) {
      peak = v;
    }
    const ddAmount = peak - v;
    const ddPct = peak > 0 ? ddAmount / peak : 0;

    if (ddPct > maxDDPct) {
      maxDDPct = ddPct;
      maxDDAmount = ddAmount;
      peakAtMax = peak;
      troughAtMax = v;
    }
  }

  return {
    maxDrawdownPct: maxDDPct,
    maxDrawdownAmount: maxDDAmount,
    peakValue: peakAtMax,
    troughValue: troughAtMax,
  };
}

/**
 * Composite diversification and concentration score (0 to 100) using Herfindahl-Hirschman Index.
 */
export function calculateDiversificationScore(
  positions: { capitalValue?: number; sector?: string | null }[],
): DiversificationAnalysis {
  const total = positions.reduce((s, p) => s + (p.capitalValue || 0), 0);
  if (total <= 0 || positions.length === 0) {
    return {
      score: 100,
      level: "Équilibrée",
      topHoldingWeight: 0,
      topSectorWeight: 0,
      recommendations: ["Ajoutez des positions pour analyser la diversification."],
    };
  }

  // 1. Holding weights & HHI
  const holdingWeights = positions.map(
    (p) => ((p.capitalValue || 0) / total) * 100,
  );
  const holdingHHI = holdingWeights.reduce((s, w) => s + Math.pow(w, 2), 0); // 0 to 10000
  const topHoldingWeight = Math.max(...holdingWeights, 0);

  // 2. Sector weights & HHI
  const sectorMap: Record<string, number> = {};
  positions.forEach((p) => {
    const s = p.sector || "Autre";
    sectorMap[s] = (sectorMap[s] || 0) + (p.capitalValue || 0);
  });
  const sectorWeights = Object.values(sectorMap).map((val) => (val / total) * 100);
  const sectorHHI = sectorWeights.reduce((s, w) => s + Math.pow(w, 2), 0);
  const topSectorWeight = Math.max(...sectorWeights, 0);

  // Score computation: Base 100 penalized by high concentration
  // Perfect portfolio: holdingHHI ~ 500-1000, sectorHHI ~ 1500
  let score = 100;
  if (holdingHHI > 2500) score -= Math.min(35, ((holdingHHI - 2500) / 7500) * 35);
  if (sectorHHI > 3000) score -= Math.min(30, ((sectorHHI - 3000) / 7000) * 30);
  if (topHoldingWeight > 25) score -= (topHoldingWeight - 25) * 0.8;
  if (positions.length < 5) score -= (5 - positions.length) * 4;

  score = Math.max(15, Math.min(100, Math.round(score)));

  let level: DiversificationAnalysis["level"] = "Équilibrée";
  if (score >= 80) level = "Excellente";
  else if (score < 55) level = "Concentrée";

  const recommendations: string[] = [];
  if (topHoldingWeight > 20) {
    recommendations.push(
      `Votre 1ère ligne représente ${topHoldingWeight.toFixed(1)}% du portefeuille. Envisagez de rééquilibrer sous les 15-20%.`,
    );
  }
  if (topSectorWeight > 40) {
    recommendations.push(
      `Forte concentration sectorielle (${topSectorWeight.toFixed(1)}%). Pensez à diversifier sur des secteurs complémentaires.`,
    );
  }
  if (positions.length < 5) {
    recommendations.push(
      `Portefeuille composé de seulement ${positions.length} actif(s). Idéalement, visez entre 8 et 15 lignes pour un PEA résilient.`,
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Excellente répartition globale des actifs et des secteurs !",
    );
  }

  return {
    score,
    level,
    topHoldingWeight,
    topSectorWeight,
    recommendations,
  };
}

/**
 * Calculates full risk metrics from history and current positions.
 */
export function computePortfolioRiskMetrics(
  history: { total_value: number; date?: string }[],
  positions: { capitalValue?: number; sector?: string | null }[],
  totalInvested = 0,
  totalCurrentValue = 0,
): PortfolioRiskMetrics {
  const values = history.map((h) => Number(h.total_value) || 0).filter((v) => v > 0);
  const dailyReturns = calculateDailyReturns(values);
  const annualizedVolatility = calculateVolatility(dailyReturns);

  // Simple annualized return proxy
  const totalReturn = totalInvested > 0 ? (totalCurrentValue - totalInvested) / totalInvested : 0;
  const annualizedReturn = totalReturn; // Default simple return

  const sharpeRatio = calculateSharpeRatio(annualizedReturn, annualizedVolatility);
  const maxDrawdown = calculateMaxDrawdown(values);
  const diversification = calculateDiversificationScore(positions);

  return {
    annualizedVolatility,
    sharpeRatio,
    maxDrawdown,
    diversification,
    annualizedReturn,
  };
}
