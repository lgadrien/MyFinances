import { describe, it, expect } from "vitest";
import { calculateDCASimulation } from "@/lib/dca-calculator";

describe("DCA & Compound Interest Calculator", () => {
  it("calculates zero-growth contributions correctly", () => {
    const result = calculateDCASimulation({
      initialCapital: 1000,
      monthlyContribution: 100,
      years: 1,
      annualGrowthRate: 0,
      dividendYieldRate: 0,
    });

    // 1000 initial + 12 * 100 = 2200 €
    expect(result.totalContributed).toBe(2200);
    expect(result.finalValue).toBe(2200);
    expect(result.totalGains).toBe(0);
  });

  it("compounds capital with growth and dividends over 10 years", () => {
    const result = calculateDCASimulation({
      initialCapital: 5000,
      monthlyContribution: 300,
      years: 10,
      annualGrowthRate: 0.06, // 6% capital growth
      dividendYieldRate: 0.02, // 2% dividend yield -> 8% total
    });

    // 5000 + 300 * 120 = 41 000 € contributed
    expect(result.totalContributed).toBe(41000);
    // Compounded final value at 8% total return should exceed 60 000 €
    expect(result.finalValue).toBeGreaterThan(60000);
    expect(result.totalGains).toBeGreaterThan(20000);
    expect(result.milestones).toHaveLength(11); // Year 0 to 10
  });

  it("handles empty initial deposit gracefully", () => {
    const result = calculateDCASimulation({
      initialCapital: 0,
      monthlyContribution: 200,
      years: 5,
      annualGrowthRate: 0.07,
    });

    expect(result.totalContributed).toBe(12000); // 200 * 60
    expect(result.finalValue).toBeGreaterThan(14000);
  });
});
