-- =============================================
-- MyFinances — Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Table: assets (catalogue d'actions suivies)
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  sector VARCHAR(50),
  currency VARCHAR(5) DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: transactions (opérations d'achat / dividende)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker VARCHAR(10) NOT NULL REFERENCES assets(ticker) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Achat', 'Dividende')),
  date DATE NOT NULL,
  quantity NUMERIC(12,4) DEFAULT 0,
  unit_price NUMERIC(12,4) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  fees NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour accélérer les requêtes par ticker
CREATE INDEX IF NOT EXISTS idx_transactions_ticker ON transactions(ticker);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- =============================================
-- Données de démonstration (optionnel)
-- =============================================

INSERT INTO assets (ticker, name, sector, currency) VALUES
  ('AI.PA', 'Air Liquide', 'Chimie', 'EUR'),
  ('BNP.PA', 'BNP Paribas', 'Banque', 'EUR'),
  ('MC.PA', 'LVMH', 'Luxe', 'EUR'),
  ('TTE.PA', 'TotalEnergies', 'Énergie', 'EUR'),
  ('SAN.PA', 'Sanofi', 'Santé', 'EUR'),
  ('OR.PA', 'L''Oréal', 'Cosmétique', 'EUR'),
  ('SU.PA', 'Schneider Electric', 'Industrie', 'EUR'),
  ('CAP.PA', 'Capgemini', 'Tech', 'EUR')
ON CONFLICT (ticker) DO NOTHING;

INSERT INTO transactions (ticker, type, date, quantity, unit_price, total_amount, fees) VALUES
  ('AI.PA',  'Achat',     '2024-03-15', 10, 178.50, 1785.00, 1.99),
  ('AI.PA',  'Achat',     '2024-06-20', 5,  165.30, 826.50,  1.99),
  ('AI.PA',  'Dividende', '2024-07-10', 0,  0,      45.00,   0),
  ('BNP.PA', 'Achat',     '2024-02-10', 20, 58.20,  1164.00, 1.99),
  ('BNP.PA', 'Dividende', '2024-05-15', 0,  0,      84.00,   0),
  ('MC.PA',  'Achat',     '2024-01-20', 3,  725.00, 2175.00, 1.99),
  ('MC.PA',  'Dividende', '2024-04-20', 0,  0,      42.00,   0),
  ('TTE.PA', 'Achat',     '2024-04-05', 25, 62.80,  1570.00, 1.99),
  ('TTE.PA', 'Dividende', '2024-06-25', 0,  0,      47.50,   0),
  ('TTE.PA', 'Dividende', '2024-09-25', 0,  0,      47.50,   0),
  ('SAN.PA', 'Achat',     '2024-05-12', 15, 91.50,  1372.50, 1.99),
  ('SAN.PA', 'Dividende', '2024-08-15', 0,  0,      57.00,   0),
  ('CAP.PA', 'Achat',     '2024-07-01', 8,  195.00, 1560.00, 1.99);
