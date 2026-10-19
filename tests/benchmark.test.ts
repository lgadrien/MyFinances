import { describe, it, expect } from "vitest";
import { mergeBenchmarkData } from "@/hooks/useBenchmark";

describe("Benchmark comparison", () => {
  it("does not count a deposit as portfolio performance", () => {
    const history = [
      { date: "2026-10-01", total_value: 10000, total_invested: 10000 },
      { date: "2026-10-02", total_value: 20000, total_invested: 20000 },
    ];
    const bench = [
      { date: "2026-10-01", pct: 0 },
      { date: "2026-10-02", pct: 0 },
    ];
    const merged = mergeBenchmarkData(history, bench, "cac40");
    expect(merged.map((p) => p.portfolio)).toEqual([0, 0]);
  });

  it("rebases both series to 0 % on the first common date", () => {
    const history = [
      { date: "2026-10-01", total_value: 100, total_invested: 100 },
      { date: "2026-10-02", total_value: 110, total_invested: 100 },
      { date: "2026-10-05", total_value: 121, total_invested: 100 },
    ];
    // The index series starts earlier (its own range) and is already +10 % on the first common date
    const bench = [
      { date: "2026-09-30", pct: 0 },
      { date: "2026-10-02", pct: 10 },
      { date: "2026-10-05", pct: 21 },
    ];
    const merged = mergeBenchmarkData(history, bench, "cac40");
    expect(merged.map((p) => p.date)).toEqual(["2026-10-02", "2026-10-05"]);
    expect(merged.map((p) => p.portfolio)).toEqual([0, 10]);
    expect(merged.map((p) => p.benchmark)).toEqual([0, 10]);
  });
});
