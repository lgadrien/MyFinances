import { describe, it, expect } from "vitest";
import {
  calculateDailyReturns,
  calculateVolatility,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateDiversificationScore,
  computePortfolioRiskMetrics,
} from "@/lib/risk-metrics";

describe("Risk & Portfolio Metrics", () => {
  it("calculates daily returns correctly", () => {
    const values = [100, 105, 99.75];
    const returns = calculateDailyReturns(values);
    expect(returns).toHaveLength(2);
    expect(returns[0]).toBeCloseTo(0.05, 4); // +5%
    expect(returns[1]).toBeCloseTo(-0.05, 4); // -5%
  });

  it("calculates annualized volatility from returns", () => {
    // Sample std of [0.01, -0.01] = 0.01414 → × √252
    expect(calculateVolatility([0.01, -0.01])).toBeCloseTo(0.2245, 4);
  });

  it("treats a deposit as a cash flow, not as performance", () => {
    const invested = [10000, 10000, 20000, 20000];
    const history = [10000, 10100, 20100, 20000].map((total_value, i) => ({
      total_value,
      total_invested: invested[i],
    }));
    const metrics = computePortfolioRiskMetrics(history, []);
    expect(metrics.annualizedVolatility).toBeCloseTo(0.1211, 4);
    // Mean daily return × 252, the deposit day counting as 0 %
    expect(metrics.annualizedReturn).toBeCloseTo(((0.01 + 0 - 100 / 20100) / 3) * 252, 10);
  });

  it("does not count a break-even sale as a drawdown", () => {
    const history = [10000, 10000, 5000].map((v) => ({ total_value: v, total_invested: v }));
    expect(computePortfolioRiskMetrics(history, []).maxDrawdown.maxDrawdownPct).toBe(0);
  });

  it("calculates Sharpe Ratio with positive and negative excess returns", () => {
    const positiveSharpe = calculateSharpeRatio(0.12, 0.15, 0.03); // (12% - 3%) / 15% = 0.6
    expect(positiveSharpe).toBeCloseTo(0.6, 2);

    const negativeSharpe = calculateSharpeRatio(-0.05, 0.15, 0.03); // (-5% - 3%) / 15% = -0.533
    expect(negativeSharpe).toBeCloseTo(-0.533, 2);
  });

  it("calculates Maximum Drawdown (MDD) correctly", () => {
    // Peak at 120, trough at 90 -> Drawdown = (120 - 90)/120 = 25%
    const values = [100, 110, 120, 105, 90, 115, 130];
    const mdd = calculateMaxDrawdown(values);

    expect(mdd.peakValue).toBe(120);
    expect(mdd.troughValue).toBe(90);
    expect(mdd.maxDrawdownAmount).toBe(30);
    expect(mdd.maxDrawdownPct).toBeCloseTo(0.25, 2); // 25%
  });

  it("computes diversification score with penalty for heavy single stock weight", () => {
    // 1 position taking 90% of portfolio
    const concentratedPositions = [
      { capitalValue: 9000, sector: "Luxe" },
      { capitalValue: 500, sector: "Tech" },
      { capitalValue: 500, sector: "Santé" },
    ];
    const concentratedScore = calculateDiversificationScore(concentratedPositions);
    expect(concentratedScore.level).toBe("Concentrée");
    expect(concentratedScore.score).toBeLessThan(60);
    expect(concentratedScore.recommendations.length).toBeGreaterThan(0);

    // 10 well-distributed positions across sectors
    const diversifiedPositions = [
      { capitalValue: 1000, sector: "Luxe" },
      { capitalValue: 1000, sector: "Tech" },
      { capitalValue: 1000, sector: "Santé" },
      { capitalValue: 1000, sector: "Énergie" },
      { capitalValue: 1000, sector: "Finance" },
      { capitalValue: 1000, sector: "Industrie" },
      { capitalValue: 1000, sector: "Consommation" },
      { capitalValue: 1000, sector: "Télécom" },
      { capitalValue: 1000, sector: "Matériaux" },
      { capitalValue: 1000, sector: "Utilities" },
    ];
    const diversifiedScore = calculateDiversificationScore(diversifiedPositions);
    expect(diversifiedScore.level).toBe("Excellente");
    expect(diversifiedScore.score).toBeGreaterThanOrEqual(80);
  });
});
