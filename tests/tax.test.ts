import { describe, it, expect } from "vitest";

describe("PEA Taxation Logic", () => {
  it("calculates social security deductions (17.2%) proportionally to capital gain share", () => {
    const totalCapital = 10000;
    const totalPlusValue = 2000; // 20% gain
    const withdrawal = 5000; // 50% partial withdrawal

    const withdrawalRatio = withdrawal / totalCapital; // 0.5
    const taxableGain = totalPlusValue * withdrawalRatio; // 1000 €
    const tax = taxableGain * 0.172; // 172 €
    const netReceived = withdrawal - tax; // 4828 €

    expect(withdrawalRatio).toBe(0.5);
    expect(taxableGain).toBe(1000);
    expect(tax).toBeCloseTo(172, 2);
    expect(netReceived).toBeCloseTo(4828, 2);
  });

  it("yields 0 taxes when portfolio is at a loss", () => {
    const totalCapital = 8000;
    const totalPlusValue = -2000; // Loss
    const withdrawal = 4000;

    const withdrawalRatio = withdrawal / totalCapital;
    const taxableGain = Math.max(0, totalPlusValue * withdrawalRatio);
    const tax = taxableGain * 0.172;
    const netReceived = withdrawal - tax;

    expect(taxableGain).toBe(0);
    expect(tax).toBe(0);
    expect(netReceived).toBe(4000);
  });
});
