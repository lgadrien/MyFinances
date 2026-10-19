import { describe, it, expect } from "vitest";
import {
  calculateDailyChange,
  calculateDividends,
  calculatePortfolioPositions,
  enrichPositions,
  groupDividendsByMonth,
  type Transaction,
} from "@/lib/calculations";

const tx = (
  type: Transaction["type"],
  quantity: number,
  unit_price: number,
  total_amount: number,
  date = "2025-01-01",
): Transaction => ({
  id: "",
  ticker: "AI.PA",
  type,
  date,
  quantity,
  unit_price,
  total_amount,
  fees: 0,
  created_at: "",
});

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
    const [position] = calculatePortfolioPositions(transactions);
    expect(position.pru).toBeCloseTo(55.2, 2);
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
    const totalInvested = calculatePortfolioPositions(transactions).reduce(
      (sum, p) => sum + p.totalInvested,
      0,
    );
    expect(totalInvested).toBe(251);
  });

  it("uses total_amount as the cost when unit_price is 0 (CSV import)", () => {
    const [position] = calculatePortfolioPositions([tx("Achat", 10, 0, 1000)]);
    expect(position.pru).toBe(100);
  });

  it("drops closed positions but keeps their dividends in the total", () => {
    const transactions = [
      tx("Achat", 10, 100, 1000, "2025-01-01"),
      tx("Dividende", 0, 0, 50, "2025-05-01"),
      tx("Vente", 10, 100, 1000, "2025-06-01"),
    ];
    expect(calculatePortfolioPositions(transactions)).toEqual([]);
    expect(calculateDividends(transactions)).toBe(50);
  });

  it("values positions at the live quote, or at the PRU when the quote is missing", () => {
    const positions = calculatePortfolioPositions([
      tx("Achat", 10, 100, 1000),
      { ...tx("Achat", 5, 20, 100), ticker: "BN.PA" },
    ]);
    const [ai, bn] = enrichPositions(positions, { "AI.PA": { price: 120 } });
    expect(ai).toMatchObject({ currentPrice: 120, capitalValue: 1200, plusValue: 200 });
    expect(bn).toMatchObject({ currentPrice: 20, capitalValue: 100, plusValue: 0 });
  });

  it("sums the day's change over open positions and rates it against yesterday's value", () => {
    const positions = enrichPositions(
      calculatePortfolioPositions([
        tx("Achat", 10, 100, 1000),
        { ...tx("Achat", 5, 20, 100), ticker: "BN.PA" },
        { ...tx("Achat", 2, 50, 100), ticker: "ML.PA" }, // no quote: valued at the PRU, no change
      ]),
      { "AI.PA": { price: 110 }, "BN.PA": { price: 18 } },
    );
    const quotes = { "AI.PA": { change: 10 }, "BN.PA": { change: -2 } };

    // +10 × 10 − 2 × 5 = +90 on a 1 290 value today, so 1 200 yesterday
    expect(calculateDailyChange(positions, quotes)).toEqual({ amount: 90, percent: 90 / 1200 });
    expect(calculateDailyChange([], {})).toEqual({ amount: 0, percent: 0 });
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

  it("orders same-day transactions by entry time (buy then sell closes the position)", () => {
    const transactions: Transaction[] = [
      // API returns newest first: the sell comes before the buy in the input
      {
        id: "2",
        ticker: "AIR.PA",
        type: "Vente",
        date: "2025-03-03",
        quantity: 10,
        unit_price: 110,
        total_amount: 1100,
        fees: 0,
        created_at: "2025-03-03T15:00:00Z",
      },
      {
        id: "1",
        ticker: "AIR.PA",
        type: "Achat",
        date: "2025-03-03",
        quantity: 10,
        unit_price: 100,
        total_amount: 1000,
        fees: 0,
        created_at: "2025-03-03T09:00:00Z",
      },
    ];

    expect(calculatePortfolioPositions(transactions)).toHaveLength(0);
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
