/**
 * lib/technical-analysis.ts
 * Moteur d'indicateurs techniques pour l'analyse de tendances.
 *
 * Indicateurs implémentés :
 *  - SMA  (Simple Moving Average)
 *  - EMA  (Exponential Moving Average)
 *  - RSI  (Relative Strength Index, 14 périodes)
 *  - MACD (EMA 12 - EMA 26, signal EMA 9)
 *  - Bollinger Bands (SMA 20 ± 2σ)
 *  - ATR  (Average True Range, 14 périodes — volatilité)
 *  - Signal composite (STRONG_BUY → STRONG_SELL)
 */

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Moving Averages ──────────────────────────────────────────────────────────

export function sma(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

export function ema(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  const k = 2 / (period + 1);
  let emaVal: number | null = null;

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result[i] = null;
      continue;
    }
    if (emaVal === null) {
      // Bootstrap with SMA
      emaVal = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    } else {
      emaVal = closes[i] * k + emaVal * (1 - k);
    }
    result[i] = emaVal;
  }
  return result;
}

// ─── RSI ──────────────────────────────────────────────────────────────────────

export function rsi(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;

  let avgGain = 0;
  let avgLoss = 0;

  // Initial average
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    // Wilder smoothing
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

// ─── MACD ─────────────────────────────────────────────────────────────────────

export interface MACDPoint {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

export function macd(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MACDPoint[] {
  const fastEma = ema(closes, fastPeriod);
  const slowEma = ema(closes, slowPeriod);

  const macdLine: (number | null)[] = closes.map((_, i) => {
    const f = fastEma[i];
    const s = slowEma[i];
    return f !== null && s !== null ? f - s : null;
  });

  // EMA of MACD line for signal
  const macdValues = macdLine.filter((v): v is number => v !== null);
  const signalRaw = ema(macdValues, signalPeriod);

  // Re-align signal with macdLine indices
  const signalLine: (number | null)[] = new Array(closes.length).fill(null);
  let signalIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] !== null) {
      signalLine[i] = signalRaw[signalIdx] ?? null;
      signalIdx++;
    }
  }

  return closes.map((_, i) => {
    const m = macdLine[i];
    const s = signalLine[i];
    return {
      macd: m,
      signal: s,
      histogram: m !== null && s !== null ? m - s : null,
    };
  });
}

// ─── Bollinger Bands ──────────────────────────────────────────────────────────

export interface BollingerPoint {
  upper: number | null;
  middle: number | null;
  lower: number | null;
  bandwidth: number | null;
  percentB: number | null; // 0 = lower, 1 = upper
}

export function bollingerBands(
  closes: number[],
  period = 20,
  stdDevMult = 2,
): BollingerPoint[] {
  return closes.map((_, i) => {
    if (i < period - 1) {
      return {
        upper: null,
        middle: null,
        lower: null,
        bandwidth: null,
        percentB: null,
      };
    }
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance =
      slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);
    const upper = mean + stdDevMult * stdDev;
    const lower = mean - stdDevMult * stdDev;
    const bandwidth = mean > 0 ? ((upper - lower) / mean) * 100 : null;
    const price = closes[i];
    const percentB = upper !== lower ? (price - lower) / (upper - lower) : 0.5;

    return { upper, middle: mean, lower, bandwidth, percentB };
  });
}

// ─── ATR (Volatilité) ─────────────────────────────────────────────────────────

export function atr(data: OHLCV[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < 2) return result;

  const trueRanges: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const curr = data[i];
    const prev = data[i - 1];
    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close),
    );
    trueRanges.push(tr);
  }

  // Initial ATR = simple average
  let atrVal = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period] = atrVal;

  for (let i = period; i < trueRanges.length; i++) {
    atrVal = (atrVal * (period - 1) + trueRanges[i]) / period;
    result[i + 1] = atrVal;
  }

  return result;
}

// ─── Signal Composite ─────────────────────────────────────────────────────────

export type TrendSignal =
  | "STRONG_BUY"
  | "BUY"
  | "NEUTRAL"
  | "SELL"
  | "STRONG_SELL";

export interface TrendScore {
  signal: TrendSignal;
  score: number; // -4 à +4 (somme des votes)
  confidence: number; // 0-100 % (proportion d'indicateurs disponibles)
  details: {
    rsiSignal: TrendSignal | null;
    macdSignal: TrendSignal | null;
    bollingerSignal: TrendSignal | null;
    maSignal: TrendSignal | null; // Prix vs SMA20 & SMA50
    momentumSignal: TrendSignal | null; // Var(1j)
  };
  indicators: {
    rsi: number | null;
    macd: number | null;
    macdHistogram: number | null;
    sma20: number | null;
    sma50: number | null;
    bollingerPercentB: number | null;
    atrPercent: number | null; // ATR/prix en %
  };
}

/** Calcule le signal composite à partir des données OHLCV */
export function computeTrendScore(data: OHLCV[]): TrendScore {
  const closes = data.map((d) => d.close);
  const n = closes.length;

  // ── RSI ──
  const rsiSeries = rsi(closes);
  const lastRsi = rsiSeries[n - 1];

  let rsiSignal: TrendSignal | null = null;
  if (lastRsi !== null) {
    if (lastRsi < 30) rsiSignal = "STRONG_BUY";
    else if (lastRsi < 45) rsiSignal = "BUY";
    else if (lastRsi > 70) rsiSignal = "STRONG_SELL";
    else if (lastRsi > 55) rsiSignal = "SELL";
    else rsiSignal = "NEUTRAL";
  }

  // ── MACD ──
  const macdSeries = macd(closes);
  const lastMacd = macdSeries[n - 1];

  let macdSignal: TrendSignal | null = null;
  if (lastMacd.histogram !== null && lastMacd.macd !== null) {
    const prev = macdSeries[n - 2];
    const prevHist = prev?.histogram ?? 0;
    const currHist = lastMacd.histogram;

    // Crossover bullish: histogram crosses 0 upward
    if (currHist > 0 && prevHist <= 0) macdSignal = "STRONG_BUY";
    else if (currHist > 0) macdSignal = "BUY";
    else if (currHist < 0 && prevHist >= 0) macdSignal = "STRONG_SELL";
    else if (currHist < 0) macdSignal = "SELL";
    else macdSignal = "NEUTRAL";
  }

  // ── Bollinger Bands ──
  const bbSeries = bollingerBands(closes);
  const lastBB = bbSeries[n - 1];

  let bollingerSignal: TrendSignal | null = null;
  if (lastBB.percentB !== null) {
    const pB = lastBB.percentB;
    if (pB < 0)
      bollingerSignal = "STRONG_BUY"; // prix sous la bande basse
    else if (pB < 0.25) bollingerSignal = "BUY";
    else if (pB > 1)
      bollingerSignal = "STRONG_SELL"; // prix sur la bande haute
    else if (pB > 0.75) bollingerSignal = "SELL";
    else bollingerSignal = "NEUTRAL";
  }

  // ── SMA 20 & 50 ──
  const sma20Series = sma(closes, 20);
  const sma50Series = sma(closes, 50);
  const lastSma20 = sma20Series[n - 1];
  const lastSma50 = sma50Series[n - 1];
  const lastClose = closes[n - 1];

  let maSignal: TrendSignal | null = null;
  if (lastSma20 !== null && lastSma50 !== null) {
    const aboveSma20 = lastClose > lastSma20;
    const aboveSma50 = lastClose > lastSma50;
    const goldenCross = lastSma20 > lastSma50;

    if (aboveSma20 && aboveSma50 && goldenCross) maSignal = "STRONG_BUY";
    else if (aboveSma20 && aboveSma50) maSignal = "BUY";
    else if (!aboveSma20 && !aboveSma50 && !goldenCross)
      maSignal = "STRONG_SELL";
    else if (!aboveSma20 && !aboveSma50) maSignal = "SELL";
    else maSignal = "NEUTRAL";
  } else if (lastSma20 !== null) {
    maSignal = lastClose > lastSma20 ? "BUY" : "SELL";
  }

  // ── Momentum (variation sur 1 point) ──
  const prev1 = closes[n - 2];
  const momentumPct = prev1 > 0 ? ((lastClose - prev1) / prev1) * 100 : 0;
  let momentumSignal: TrendSignal | null = null;
  if (n >= 2) {
    if (momentumPct > 3) momentumSignal = "STRONG_BUY";
    else if (momentumPct > 0.5) momentumSignal = "BUY";
    else if (momentumPct < -3) momentumSignal = "STRONG_SELL";
    else if (momentumPct < -0.5) momentumSignal = "SELL";
    else momentumSignal = "NEUTRAL";
  }

  // ── ATR ──
  const atrSeries = atr(data);
  const lastAtr = atrSeries[n - 1];
  const atrPercent =
    lastAtr !== null && lastClose > 0 ? (lastAtr / lastClose) * 100 : null;

  // ── Score composite ──
  const signalWeight: Record<TrendSignal, number> = {
    STRONG_BUY: 2,
    BUY: 1,
    NEUTRAL: 0,
    SELL: -1,
    STRONG_SELL: -2,
  };

  const signals = [
    rsiSignal,
    macdSignal,
    bollingerSignal,
    maSignal,
    momentumSignal,
  ];
  const available = signals.filter((s) => s !== null) as TrendSignal[];
  const score = available.reduce((sum, s) => sum + signalWeight[s], 0);
  const confidence = Math.round((available.length / signals.length) * 100);

  // ── Signal final ──
  let signal: TrendSignal;
  if (score >= 3) signal = "STRONG_BUY";
  else if (score >= 1) signal = "BUY";
  else if (score <= -3) signal = "STRONG_SELL";
  else if (score <= -1) signal = "SELL";
  else signal = "NEUTRAL";

  return {
    signal,
    score,
    confidence,
    details: {
      rsiSignal,
      macdSignal,
      bollingerSignal,
      maSignal,
      momentumSignal,
    },
    indicators: {
      rsi: lastRsi !== null ? Math.round(lastRsi * 10) / 10 : null,
      macd:
        lastMacd.macd !== null ? Math.round(lastMacd.macd * 1000) / 1000 : null,
      macdHistogram:
        lastMacd.histogram !== null
          ? Math.round(lastMacd.histogram * 1000) / 1000
          : null,
      sma20: lastSma20 !== null ? Math.round(lastSma20 * 100) / 100 : null,
      sma50: lastSma50 !== null ? Math.round(lastSma50 * 100) / 100 : null,
      bollingerPercentB:
        lastBB.percentB !== null
          ? Math.round(lastBB.percentB * 100) / 100
          : null,
      atrPercent:
        atrPercent !== null ? Math.round(atrPercent * 100) / 100 : null,
    },
  };
}

// ─── Helpers UI ──────────────────────────────────────────────────────────────

export const SIGNAL_CONFIG: Record<
  TrendSignal,
  {
    label: string;
    emoji: string;
    color: string;
    bgColor: string;
    badgeVariant: "success" | "danger" | "warning" | "neutral";
  }
> = {
  STRONG_BUY: {
    label: "Fort achat",
    emoji: "🚀",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    badgeVariant: "success",
  },
  BUY: {
    label: "Achat",
    emoji: "📈",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    badgeVariant: "success",
  },
  NEUTRAL: {
    label: "Neutre",
    emoji: "⚖️",
    color: "text-zinc-400",
    bgColor: "bg-zinc-500/10",
    badgeVariant: "neutral",
  },
  SELL: {
    label: "Vente",
    emoji: "📉",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    badgeVariant: "danger",
  },
  STRONG_SELL: {
    label: "Fort vente",
    emoji: "🔻",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    badgeVariant: "danger",
  },
};

/** Transforme un signal sous-indicateur en texte court */
export function signalToFR(s: TrendSignal | null): string {
  if (s === null) return "—";
  return SIGNAL_CONFIG[s].label;
}
