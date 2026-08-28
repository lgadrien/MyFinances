-- ============================================================
--  MyFinances — Supabase Database Setup (PEA Tracker)
--  Run this entire file in the Supabase SQL Editor once.
--  Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. TRANSACTIONS
--    Stores every buy / sell / dividend operation.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker        TEXT          NOT NULL,
    type          TEXT          NOT NULL CHECK (type IN ('Achat', 'Vente', 'Dividende')),
    date          DATE          NOT NULL,
    quantity      NUMERIC(18,6) NOT NULL DEFAULT 0,
    unit_price    NUMERIC(18,4) NOT NULL DEFAULT 0,
    total_amount  NUMERIC(18,4) NOT NULL DEFAULT 0,
    fees          NUMERIC(18,4) NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_ticker ON public.transactions (ticker);
CREATE INDEX IF NOT EXISTS idx_transactions_date   ON public.transactions (date DESC);

-- ─────────────────────────────────────────────────────────────
-- 2. FAVORITES
--    Watchlist tickers saved by the user.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker      TEXT        NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_favorites_ticker ON public.favorites (ticker);

-- ─────────────────────────────────────────────────────────────
-- 3. SETTINGS
--    Stores user cash balance & capital target.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_balance    NUMERIC(18,2) NOT NULL DEFAULT 0,
    target_capital  NUMERIC(18,2) NOT NULL DEFAULT 50000,
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Insert initial settings row if not present
INSERT INTO public.settings (cash_balance, target_capital)
SELECT 0, 50000
WHERE NOT EXISTS (SELECT 1 FROM public.settings);

-- ─────────────────────────────────────────────────────────────
-- 4. PORTFOLIO HISTORY
--    Daily snapshots of total portfolio value (filled by cron).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portfolio_history (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    date            DATE          NOT NULL UNIQUE,
    total_value     NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_invested  NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_history_date ON public.portfolio_history (date DESC);

-- ─────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_transactions"
    ON public.transactions FOR ALL TO anon
    USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_favorites"
    ON public.favorites FOR ALL TO anon
    USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_settings"
    ON public.settings FOR ALL TO anon
    USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_portfolio_history"
    ON public.portfolio_history FOR ALL TO anon
    USING (true) WITH CHECK (true);
