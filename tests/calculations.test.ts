import { describe, it, expect } from "vitest";
import {
  calculatePRU,
  calculateTotalInvested,
  calculateDividends,
  calculatePlusValue,
  calculatePortfolioPositions,
  groupDividendsByMonth,
  type Transaction,
} from "@/lib/calculations";

describe("Financial Calculations Engine", () => {
  it("calculates PRU correctly with multiple purchases and fees", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        ticker: "TTE.PA",
        type: "Achat",
        date: "2025-01-10",
        quantity: 10,
        unit_price: 50,
        total_amount: 500,
        fees: 2,
        created_at: "",
      },
      {
        id: "2",
        ticker: "TTE.PA",
        type: "Achat",
        date: "2025-02-15",
        quantity: 10,
        unit_price: 60,
        total_amount: 600,
        fees: 2,
        created_at: "",
      },
    ];

    // Total cost = (10*50 + 2) + (10*60 + 2) = 502 + 602 = 1104
    // Total qty = 20
    // PRU = 1104 / 20 = 55.20
    const pru = calculatePRU(transactions);
    expect(pru).toBeCloseTo(55.2, 2);
  });

  it("handles partial sales without corrupting chronological PRU", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        ticker: "AIR.PA",
        type: "Achat",
        date: "2025-01-01",
        quantity: 10,
        unit_price: 100,
        total_amount: 1000,
        fees: 0,
        created_at: "",
      },
      {
        id: "2",
        ticker: "AIR.PA",
        type: "Vente",
        date: "2025-02-01",
        quantity: 4,
        unit_price: 130,
        total_amount: 520,
        fees: 0,
        created_at: "",
      },
    ];

    const positions = calculatePortfolioPositions(transactions);
    expect(positions).toHaveLength(1);
    expect(positions[0].totalQuantity).toBe(6);
    expect(positions[0].pru).toBe(100);
    expect(positions[0].totalInvested).toBe(600);
  });

  it("resets PRU when a position is fully liquidated then rebought", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        ticker: "MC.PA",
        type: "Achat",
        date: "2024-01-01",
        quantity: 5,
        unit_price: 700,
        total_amount: 3500,
        fees: 0,
        created_at: "",
      },
      {
        id: "2",
        ticker: "MC.PA",
        type: "Vente",
        date: "2024-06-01",
        quantity: 5,
        unit_price: 850,
        total_amount: 4250,
        fees: 0,
        created_at: "",
      },
      {
        id: "3",
        ticker: "MC.PA",
        type: "Achat",
        date: "2025-01-01",
        quantity: 2,
        unit_price: 600,
        total_amount: 1200,
        fees: 0,
        created_at: "",
      },
    ];

    const positions = calculatePortfolioPositions(transactions);
    expect(positions).toHaveLength(1);
    expect(positions[0].totalQuantity).toBe(2);
    expect(positions[0].pru).toBe(600);
    expect(positions[0].totalInvested).toBe(1200);
  });

  it("calculates total net invested capital across transactions", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        ticker: "TTE.PA",
        type: "Achat",
        date: "2025-01-01",
        quantity: 10,
        unit_price: 50,
        total_amount: 500,
        fees: 2,
        created_at: "",
      },
      {
        id: "2",
        ticker: "TTE.PA",
        type: "Vente",
        date: "2025-02-01",
        quantity: 5,
        unit_price: 60,
        total_amount: 300,
        fees: 1,
        created_at: "",
      },
    ];

    // Bought 10 @ 50 + 2 fees -> PRU = 50.20
    // Sold 5 -> Remaining 5 shares @ 50.20 PRU = 251.00 € invested in portfolio
    const totalInvested = calculateTotalInvested(transactions);
    expect(totalInvested).toBe(251);
  });

  it("calculates net dividends accurately", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        ticker: "SAN.PA",
        type: "Dividende",
        date: "2025-05-15",
        quantity: 0,
        unit_price: 0,
        total_amount: 150,
        fees: 1.5,
        created_at: "",
      },
      {
        id: "2",
        ticker: "TTE.PA",
        type: "Dividende",
        date: "2025-06-20",
        quantity: 0,
        unit_price: 0,
        total_amount: 80,
        fees: 0,
        created_at: "",
      },
    ];

    const totalDividends = calculateDividends(transactions);
    expect(totalDividends).toBe(228.5);
  });

  it("calculates latent plus-value correctly", () => {
    const pv = calculatePlusValue(100, 125, 10);
    expect(pv).toBe(250);

    const mv = calculatePlusValue(100, 80, 10);
    expect(mv).toBe(-200);
  });

  it("groups dividends by month sorted chronologically", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        ticker: "AI.PA",
        type: "Dividende",
        date: "2025-06-15",
        quantity: 0,
        unit_price: 0,
        total_amount: 100,
        fees: 0,
        created_at: "",
      },
      {
        id: "2",
        ticker: "AI.PA",
        type: "Dividende",
        date: "2025-03-10",
        quantity: 0,
        unit_price: 0,
        total_amount: 50,
        fees: 0,
        created_at: "",
      },
    ];

    const grouped = groupDividendsByMonth(transactions);
    expect(grouped).toEqual([
      { month: "2025-03", amount: 50 },
      { month: "2025-06", amount: 100 },
    ]);
  });
});
