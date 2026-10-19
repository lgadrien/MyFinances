import { describe, it, expect } from "vitest";
import {
  calculatePlanGain,
  peaTaxRate,
  type Transaction,
} from "@/lib/calculations";

const tx = (
  type: Transaction["type"],
  quantity: number,
  unit_price: number,
  total_amount: number,
  fees = 0,
): Transaction => ({
  id: "",
  ticker: "AI.PA",
  type,
  date: "2020-01-02",
  quantity,
  unit_price,
  total_amount,
  fees,
  created_at: "",
});

describe("PEA taxation", () => {
  it("taxes the dividends kept in the plan, not only the latent gain", () => {
    // 10 000 € of shares still worth 10 000 €, plus 500 € of dividends in cash
    const gain = calculatePlanGain(
      [tx("Achat", 100, 100, 10000), tx("Dividende", 0, 0, 500)],
      10000,
    );
    expect(gain).toBe(500);
    expect(gain * peaTaxRate("2020-01-02", "2026-10-19")).toBeCloseTo(93, 2);
  });

  it("counts the realised gain of a closed position", () => {
    const transactions = [tx("Achat", 10, 100, 1000), tx("Vente", 10, 200, 2000)];
    expect(calculatePlanGain(transactions, 0)).toBe(1000);
  });

  it("deducts buy and sale fees from the gain", () => {
    const transactions = [tx("Achat", 10, 100, 1000, 5), tx("Vente", 10, 200, 2000, 5)];
    expect(calculatePlanGain(transactions, 0)).toBe(990);
  });

  it("applies 31.4 % before the 5th anniversary and 18.6 % after (LFSS 2026)", () => {
    expect(peaTaxRate("2024-03-01", "2026-10-19")).toBe(0.314);
    expect(peaTaxRate("2021-10-19", "2026-10-19")).toBe(0.186);
  });
});
