-- Active l'accès complet à la table pour ce projet P2
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_balance numeric DEFAULT 0,
  target_capital numeric DEFAULT 10000,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Désactive provisoirement les contraintes de sécurité lourdes pour cet usage local
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activer lecture_ecriture" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- Initialise la seule ligne de configuration requise
INSERT INTO public.settings (cash_balance, target_capital) VALUES (0, 10000);
