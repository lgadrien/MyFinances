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
  score: number; // -4 à +4
  confidence: number;
  details: {
    rsiSignal: TrendSignal | null;
    macdSignal: TrendSignal | null;
    bollingerSignal: TrendSignal | null;
    emaSignal: TrendSignal | null;
    momentumSignal: TrendSignal | null;
    volumeSignal: TrendSignal | null;
  };
  indicators: {
    rsi: number | null;
    macd: number | null;
    macdHistogram: number | null;
    ema20: number | null;
    ema50: number | null;
    bollingerPercentB: number | null;
    atrPercent: number | null;
    volumeSurgeMultiplier: number | null;
  };
}

/** Calcule le signal composite à partir des données OHLCV */
export function computeTrendScore(data: OHLCV[]): TrendScore {
  const closes = data.map((d) => d.close);
  const volumes = data.map((d) => d.volume);
  const n = closes.length;

  // ── RSI ──
  const rsiSeries = rsi(closes);
  const lastRsi = rsiSeries[n - 1];

  let rsiSignal: TrendSignal | null = null;
  if (lastRsi !== null) {
    if (lastRsi < 20) rsiSignal = "STRONG_BUY"; // Oversold extrème
    else if (lastRsi < 40) rsiSignal = "BUY";
    else if (lastRsi > 80) rsiSignal = "STRONG_SELL"; // Overbought extrème
    else if (lastRsi > 60) rsiSignal = "SELL";
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
    if (pB < -0.1) bollingerSignal = "STRONG_BUY";
    else if (pB < 0.2) bollingerSignal = "BUY";
    else if (pB > 1.1) bollingerSignal = "STRONG_SELL";
    else if (pB > 0.8) bollingerSignal = "SELL";
    else bollingerSignal = "NEUTRAL";
  }

  // ── EMA 20 & 50 ──
  const ema20Series = ema(closes, 20);
  const ema50Series = ema(closes, 50);
  const lastEma20 = ema20Series[n - 1];
  const lastEma50 = ema50Series[n - 1];
  const lastClose = closes[n - 1];

  let emaSignal: TrendSignal | null = null;
  if (lastEma20 !== null && lastEma50 !== null) {
    const aboveEma20 = lastClose > lastEma20;
    const aboveEma50 = lastClose > lastEma50;
    const goldenCross = lastEma20 > lastEma50;

    if (aboveEma20 && aboveEma50 && goldenCross) emaSignal = "STRONG_BUY";
    else if (aboveEma20 && goldenCross) emaSignal = "BUY";
    else if (!aboveEma20 && !aboveEma50 && !goldenCross) emaSignal = "STRONG_SELL";
    else if (!aboveEma20 && !goldenCross) emaSignal = "SELL";
    else emaSignal = "NEUTRAL";
  }

  // ── Momentum ──
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

  // ── Volume Surge ──
  // Compare last volume to 20-period volume SMA
  const volSma20Series = sma(volumes, 20);
  const lastVolSma20 = volSma20Series[n - 2] ?? volSma20Series[n - 1]; 
  const lastVol = volumes[n - 1];
  
  let volumeSignal: TrendSignal | null = null;
  let volumeSurgeMultiplier = 1.0;
  
  if (lastVol !== null && lastVolSma20 !== null && lastVolSma20 > 0) {
    volumeSurgeMultiplier = lastVol / lastVolSma20;
    if (volumeSurgeMultiplier > 2.0) volumeSignal = momentumPct >= 0 ? "STRONG_BUY" : "STRONG_SELL";
    else if (volumeSurgeMultiplier > 1.5) volumeSignal = momentumPct >= 0 ? "BUY" : "SELL";
    else volumeSignal = "NEUTRAL";
  }

  // ── ATR (Volatility Filter) ──
  const atrSeries = atr(data);
  const lastAtr = atrSeries[n - 1];
  const atrPercent = lastAtr !== null && lastClose > 0 ? (lastAtr / lastClose) * 100 : null;
  
  // Si haute volatilité (ATR > 3%), on réduit le score Bollinger
  const isHighlyVolatile = atrPercent !== null && atrPercent > 3.0;

  // ── Score composite (Weighted) ──
  const signalValue: Record<TrendSignal, number> = {
    STRONG_BUY: 2,
    BUY: 1,
    NEUTRAL: 0,
    SELL: -1,
    STRONG_SELL: -2,
  };

  // Base Weights
  const macdWeight = 3;
  const emaWeight = 3;
  const rsiWeight = 2; // Peut monter à 3 si extreme
  const bbWeight = isHighlyVolatile ? 0.5 : 2; 
  const momentumWeight = 1;
  const volumeWeight = 1.5;

  let score = 0;
  let maxPossibleScore = 0;
  let availableIndicators = 0;

  if (macdSignal) {
    score += signalValue[macdSignal] * macdWeight;
    maxPossibleScore += 2 * macdWeight;
    availableIndicators++;
  }
  if (emaSignal) {
    score += signalValue[emaSignal] * emaWeight;
    maxPossibleScore += 2 * emaWeight;
    availableIndicators++;
  }
  if (rsiSignal) {
    const currentRsiWeight = (rsiSignal === "STRONG_BUY" || rsiSignal === "STRONG_SELL") ? 3 : rsiWeight;
    score += signalValue[rsiSignal] * currentRsiWeight;
    maxPossibleScore += 2 * currentRsiWeight;
    availableIndicators++;
  }
  if (bollingerSignal) {
    score += signalValue[bollingerSignal] * bbWeight;
    maxPossibleScore += 2 * bbWeight;
    availableIndicators++;
  }
  if (momentumSignal) {
    score += signalValue[momentumSignal] * momentumWeight;
    maxPossibleScore += 2 * momentumWeight;
    availableIndicators++;
  }
  if (volumeSignal) {
    score += signalValue[volumeSignal] * volumeWeight;
    maxPossibleScore += 2 * volumeWeight;
    availableIndicators++;
  }

  // Normalisation -4 / +4 range pour l'UI existante
  let normalizedScore = maxPossibleScore > 0 ? (score / maxPossibleScore) * 4 : 0;
  normalizedScore = Math.round(normalizedScore * 10) / 10;
  
  const confidence = Math.round((availableIndicators / 6) * 100);

  // ── Signal final ──
  let signal: TrendSignal;
  if (normalizedScore >= 2.5) signal = "STRONG_BUY";
  else if (normalizedScore >= 0.8) signal = "BUY";
  else if (normalizedScore <= -2.5) signal = "STRONG_SELL";
  else if (normalizedScore <= -0.8) signal = "SELL";
  else signal = "NEUTRAL";

  return {
    signal,
    score: normalizedScore,
    confidence,
    details: {
      rsiSignal,
      macdSignal,
      bollingerSignal,
      emaSignal,
      momentumSignal,
      volumeSignal
    },
    indicators: {
      rsi: lastRsi !== null ? Math.round(lastRsi * 10) / 10 : null,
      macd: lastMacd.macd !== null ? Math.round(lastMacd.macd * 1000) / 1000 : null,
      macdHistogram: lastMacd.histogram !== null ? Math.round(lastMacd.histogram * 1000) / 1000 : null,
      ema20: lastEma20 !== null ? Math.round(lastEma20 * 100) / 100 : null,
      ema50: lastEma50 !== null ? Math.round(lastEma50 * 100) / 100 : null,
      bollingerPercentB: lastBB.percentB !== null ? Math.round(lastBB.percentB * 100) / 100 : null,
      atrPercent: atrPercent !== null ? Math.round(atrPercent * 100) / 100 : null,
      volumeSurgeMultiplier: volumeSurgeMultiplier !== 1.0 ? Math.round(volumeSurgeMultiplier * 10) / 10 : null
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
