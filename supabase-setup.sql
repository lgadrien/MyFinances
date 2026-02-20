-- ============================================================
--  MyFinances — Supabase Database Setup
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

-- Index for fast filtering by ticker and date
CREATE INDEX IF NOT EXISTS idx_transactions_ticker ON public.transactions (ticker);
CREATE INDEX IF NOT EXISTS idx_transactions_date   ON public.transactions (date DESC);

-- ─────────────────────────────────────────────────────────────
-- 2. FAVORITES
--    Watchlist tickers saved by the user.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker     TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT favorites_ticker_unique UNIQUE (ticker)
);

CREATE INDEX IF NOT EXISTS idx_favorites_ticker ON public.favorites (ticker);

-- ─────────────────────────────────────────────────────────────
-- 3. SETTINGS
--    One row per user storing cash balance & capital target.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_balance    NUMERIC(18,2) NOT NULL DEFAULT 0,
    target_capital  NUMERIC(18,2) NOT NULL DEFAULT 50000,
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Insert the initial settings row (only if the table is empty)
INSERT INTO public.settings (cash_balance, target_capital)
SELECT 0, 50000
WHERE NOT EXISTS (SELECT 1 FROM public.settings);

-- ─────────────────────────────────────────────────────────────
-- 4. PORTFOLIO HISTORY
--    Daily snapshots of total portfolio value (filled by cron).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portfolio_history (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    date            DATE          NOT NULL,
    total_value     NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_invested  NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT portfolio_history_date_unique UNIQUE (date)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_history_date ON public.portfolio_history (date DESC);

-- ─────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
--    The app uses a single password (ACCESS_PASSWORD env var).
--    All requests go through the server via the anon key.
--    We use permissive RLS to allow the anon role full access
--    (the real protection is the middleware cookie check).
--
--    If you want multi-user support in the future, replace
--    these policies with auth.uid() checks.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;

-- Allow the anon role (used by the server) full CRUD on all tables
CREATE POLICY "anon_all_transactions"
    ON public.transactions
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "anon_all_favorites"
    ON public.favorites
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "anon_all_settings"
    ON public.settings
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "anon_all_portfolio_history"
    ON public.portfolio_history
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 6. OPTIONAL: sample data to test the app immediately
--    Comment out this section if you want to start fresh.
-- ─────────────────────────────────────────────────────────────
/*
INSERT INTO public.transactions (ticker, type, date, quantity, unit_price, total_amount, fees)
VALUES
    ('AI.PA',  'Achat',     '2024-01-15', 10,  178.50, 1785.00, 1.99),
    ('AI.PA',  'Dividende', '2024-07-10',  0,    0.00,   45.00, 0.00),
    ('BNP.PA', 'Achat',     '2024-02-10', 20,   58.20, 1164.00, 1.99),
    ('BNP.PA', 'Dividende', '2024-05-15',  0,    0.00,   84.00, 0.00),
    ('MC.PA',  'Achat',     '2024-01-20',  3,  725.00, 2175.00, 1.99),
    ('TTE.PA', 'Achat',     '2024-04-05', 25,   62.80, 1570.00, 1.99),
    ('TTE.PA', 'Dividende', '2024-06-25',  0,    0.00,   47.50, 0.00),
    ('SAN.PA', 'Achat',     '2024-05-12', 15,   91.50, 1372.50, 1.99);

UPDATE public.settings
SET cash_balance = 2500, target_capital = 50000
WHERE id = (SELECT id FROM public.settings LIMIT 1);
*/

-- ─────────────────────────────────────────────────────────────
-- Done! Your MyFinances database is ready.
-- ─────────────────────────────────────────────────────────────
