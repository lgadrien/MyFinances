import { describe, it, expect } from "vitest";
import { sanitizeTicker, TICKER_RE } from "@/lib/validation";

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
