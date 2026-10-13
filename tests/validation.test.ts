import { describe, it, expect } from "vitest";
import { sanitizeTicker, TICKER_RE, parseTransaction } from "@/lib/validation";

describe("Ticker Validation", () => {
  it("accepts valid stock and ETF tickers", () => {
    expect(sanitizeTicker("MC.PA")).toBe("MC.PA");
    expect(sanitizeTicker("cw8.pa")).toBe("CW8.PA");
    expect(sanitizeTicker("AAPL")).toBe("AAPL");
    expect(sanitizeTicker("^FCHI")).toBe("^FCHI");
    expect(sanitizeTicker("BTC-EUR")).toBe("BTC-EUR");
    expect(sanitizeTicker("TTE.PA")).toBe("TTE.PA");
  });

  it("trims whitespace and converts to uppercase", () => {
    expect(sanitizeTicker("  mc.pa  ")).toBe("MC.PA");
    expect(sanitizeTicker("\tal.pa\n")).toBe("AL.PA");
  });

  it("rejects invalid characters, injection attempts, and empty values", () => {
    expect(sanitizeTicker("")).toBeNull();
    expect(sanitizeTicker("   ")).toBeNull();
    expect(sanitizeTicker(null)).toBeNull();
    expect(sanitizeTicker(undefined)).toBeNull();
    expect(sanitizeTicker(123)).toBeNull();
    expect(sanitizeTicker("MC.PA; DROP TABLE transactions;")).toBeNull();
    expect(sanitizeTicker("<script>alert(1)</script>")).toBeNull();
    expect(sanitizeTicker("VERYLONGTICKERTHATEXCEEDSTWELVECHARS")).toBeNull();
    expect(sanitizeTicker("MC PA")).toBeNull(); // spaces inside are invalid
  });

  it("validates direct regex matches", () => {
    expect(TICKER_RE.test("CW8.PA")).toBe(true);
    expect(TICKER_RE.test("AIR.PA")).toBe(true);
    expect(TICKER_RE.test("BAD TICKER")).toBe(false);
  });
});

describe("Transaction validation", () => {
  const valid = {
    ticker: " mc.pa ",
    type: "Achat",
    date: "2025-01-10",
    quantity: "10",
    unit_price: 700,
    total_amount: 7000,
    fees: 2,
  };

  it("returns a normalised payload for a valid body", () => {
    expect(parseTransaction(valid)).toEqual({
      data: { ...valid, ticker: "MC.PA", quantity: 10 },
    });
  });

  it("defaults optional numbers to 0", () => {
    const { unit_price: _u, fees: _f, ...rest } = valid;
    expect(parseTransaction(rest)).toMatchObject({ data: { unit_price: 0, fees: 0 } });
  });

  it("rejects non-numeric and negative amounts", () => {
    expect(parseTransaction({ ...valid, quantity: "abc" })).toEqual({ error: "Quantité invalide" });
    expect(parseTransaction({ ...valid, total_amount: undefined })).toEqual({ error: "Montant invalide" });
    expect(parseTransaction({ ...valid, fees: -1 })).toEqual({ error: "Frais invalides" });
  });

  it("rejects bad ticker, type and date", () => {
    expect(parseTransaction({ ...valid, ticker: "  " })).toEqual({ error: "Ticker manquant" });
    expect(parseTransaction({ ...valid, type: "Gift" })).toEqual({ error: "Type invalide" });
    expect(parseTransaction({ ...valid, date: "nope" })).toEqual({ error: "Date invalide" });
    expect(parseTransaction(null)).toEqual({ error: "Ticker manquant" });
  });
});
