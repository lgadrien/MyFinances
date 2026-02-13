-- MODIFICATION POUR RENDRE L'UTILISATEUR OPTIONNEL
-- Ce script corrige l'erreur "violates not-null constraint"

-- 1. Rendre la colonne user_id optionnelle (nullable)
ALTER TABLE public.favorites ALTER COLUMN user_id DROP NOT NULL;

-- 2. Désactiver temporairement la sécurité stricte (RLS) pour le développement
ALTER TABLE public.favorites DISABLE ROW LEVEL SECURITY;

-- OU (Alternative plus propre) mettre à jour les politiques pour accepter user_id null
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

CREATE POLICY "Public Read" ON public.favorites FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON public.favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete" ON public.favorites FOR DELETE USING (true);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
