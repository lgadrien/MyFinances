/**
 * src/lib/validation.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Input validation helpers and regular expressions.
 */

/**
 * Standard ticker validation regex.
 * Accepts 1-12 uppercase alphanumeric characters and symbols: ^ . = -
 * Examples: MC.PA, CW8.PA, AAPL, ^FCHI, BTC-EUR
 */
export const TICKER_RE = /^[A-Z0-9^.=-]{1,12}$/;

/**
 * Sanitizes and validates a ticker string.
 * Returns the uppercase trimmed string if valid, or null if invalid.
 */
export function sanitizeTicker(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toUpperCase();
  return TICKER_RE.test(t) ? t : null;
}
