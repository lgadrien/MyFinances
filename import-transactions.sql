-- Importation des transactions fournies (Capture d'écran)
-- Attention : J'utilise les suffixes .PA pour TTE et BNP pour correspondre à Yahoo Finance (Bourse de Paris).

INSERT INTO public.transactions (date, type, ticker, quantity, unit_price, fees, total_amount)
VALUES
  -- 1. Achat TTE (23/06/2025) - Qté: 0.94 - Prix: 53.49 - Frais: 1.20 - Total: 51.73
  ('2025-06-23', 'Achat', 'TTE.PA', 0.94, 53.49, 1.20, 51.73),

  -- 2. Dividende TTE (06/10/2025) - Montant: 0.47 (Net) - Frais: 0.33 (Brut ~0.80)
  ('2025-10-06', 'Dividende', 'TTE.PA', 0, 0.47, 0.33, 0.47),

  -- 3. Dividende TTE (07/01/2026) - Montant: 0.47 (Net) - Frais: 0.33
  ('2026-01-07', 'Dividende', 'TTE.PA', 0, 0.47, 0.33, 0.47),

  -- 4. Achat BNP (06/03/2025) - Qté: 0.02 - Prix: 75.83 - Frais: 1.01 - Total: 2.81
  ('2025-03-06', 'Achat', 'BNP.PA', 0.02, 75.83, 1.01, 2.81),

  -- 5. Achat BNP (27/03/2025) - Qté: 0.24 - Prix: 80.01 - Frais: 1.06 - Total: 20.00
  ('2025-03-27', 'Achat', 'BNP.PA', 0.24, 80.01, 1.06, 20.00),

  -- 6. Dividende BNP (23/05/2026) - Montant: 0.73 (Net) - Frais: 0.52 (Brut ~1.25)
  ('2026-05-23', 'Dividende', 'BNP.PA', 0, 0.73, 0.52, 0.73),

  -- 7. Dividende BNP (01/10/2025) - Montant: 0.40 (Net) - Frais: 0.27 (Brut ~0.67)
  ('2025-10-01', 'Dividende', 'BNP.PA', 0, 0.40, 0.27, 0.40);

-- Note: Pour les dividendes, j'ai mis la quantité à 0 et le prix unitaire au montant net reçu,
-- car c'est généralement ce qui compte pour le calcul de performance/cash.
