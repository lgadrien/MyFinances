import { describe, it, expect } from "vitest";
import {
  rsi,
  macd,
  bollingerBands,
  sma,
  ema,
  computeTrendScore,
  type OHLCV,
} from "@/lib/technical-analysis";

describe("Technical Analysis Engine", () => {
  it("safely handles empty and short OHLCV series in computeTrendScore", () => {
    const emptyResult = computeTrendScore([]);
    expect(emptyResult.signal).toBe("NEUTRAL");
    expect(emptyResult.score).toBe(0);

    const singlePointResult = computeTrendScore([
      { date: "2025-01-01", open: 100, high: 105, low: 95, close: 100, volume: 1000 },
    ]);
    expect(singlePointResult.signal).toBe("NEUTRAL");
  });

  it("calculates SMA correctly", () => {
    const prices = [10, 20, 30, 40, 50];
    const sma3 = sma(prices, 3);
    expect(sma3[0]).toBeNull();
    expect(sma3[1]).toBeNull();
    expect(sma3[2]).toBe(20); // (10+20+30)/3
    expect(sma3[3]).toBe(30); // (20+30+40)/3
    expect(sma3[4]).toBe(40); // (30+40+50)/3
  });

  it("calculates EMA correctly with smoothing", () => {
    const prices = [10, 12, 14, 16, 18, 20];
    const emaSeries = ema(prices, 3);
    expect(emaSeries[0]).toBeNull();
    expect(emaSeries[1]).toBeNull();
    expect(emaSeries[2]).toBeCloseTo(12, 1);
    expect(emaSeries[5]).toBeGreaterThan(16);
  });

  it("calculates RSI between 0 and 100 for a realistic price series", () => {
    // 20 continuous price points
    const prices = [
      100, 102, 104, 103, 105, 107, 110, 108, 112, 115,
      114, 118, 122, 120, 125, 128, 126, 130, 133, 135,
    ];
    const rsiSeries = rsi(prices, 14);
    const lastRsi = rsiSeries[rsiSeries.length - 1];
    expect(lastRsi).not.toBeNull();
    expect(lastRsi!).toBeGreaterThan(50);
    expect(lastRsi!).toBeLessThanOrEqual(100);
  });

  it("computes MACD line and histogram", () => {
    const prices = Array.from({ length: 40 }, (_, i) => 100 + i * 2);
    const macdSeries = macd(prices);
    const last = macdSeries[macdSeries.length - 1];
    expect(last.macd).toBeDefined();
    expect(last.signal).toBeDefined();
    expect(last.histogram).toBeDefined();
  });

  it("computes Bollinger Bands with upper >= middle >= lower", () => {
    const prices = Array.from({ length: 30 }, (_, i) => 50 + Math.sin(i) * 5);
    const bb = bollingerBands(prices, 20, 2);
    const last = bb[bb.length - 1];
    expect(last.upper).not.toBeNull();
    expect(last.middle).not.toBeNull();
    expect(last.lower).not.toBeNull();
    expect(last.upper!).toBeGreaterThanOrEqual(last.middle!);
    expect(last.middle!).toBeGreaterThanOrEqual(last.lower!);
  });

  it("identifies oversold and overbought signals correctly", () => {
    // Parabolic drop with low RSI (< 20)
    const dropSeries: OHLCV[] = Array.from({ length: 40 }, (_, i) => ({
      date: `2025-01-${(i + 1).toString().padStart(2, "0")}`,
      open: 200 - i * 3,
      high: 201 - i * 3,
      low: 195 - i * 3,
      close: 196 - i * 3,
      volume: 10000,
    }));

    const dropScore = computeTrendScore(dropSeries);
    expect(dropScore.details.rsiSignal).toBe("STRONG_BUY"); // Oversold -> strong buy signal

    // Parabolic surge with high RSI (> 80)
    const surgeSeries: OHLCV[] = Array.from({ length: 40 }, (_, i) => ({
      date: `2025-01-${(i + 1).toString().padStart(2, "0")}`,
      open: 100 + i * 3,
      high: 105 + i * 3,
      low: 99 + i * 3,
      close: 104 + i * 3,
      volume: 10000,
    }));

    const surgeScore = computeTrendScore(surgeSeries);
    expect(surgeScore.details.rsiSignal).toBe("STRONG_SELL"); // Overbought -> take profit / strong sell signal
  });
});
