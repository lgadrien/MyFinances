-- ============================================================
--  MyFinances — Migration RLS Lockdown (Zero-Anon Architecture)
-- ============================================================
--  Exécutez ce script dans Supabase Dashboard → SQL Editor.
--
--  POURQUOI CETTE MIGRATION ?
--  -------------------------
--  Auparavant, les tables autorisaient l'accès complet (lecture/écriture)
--  au rôle public "anon" (clé anon publique exposée dans le navigateur).
--  Désormais, toutes les opérations DB sont isolées côté serveur dans les
--  API Routes Next.js via le client `supabaseAdmin` utilisant la clé
--  `SUPABASE_SERVICE_ROLE_KEY`.
--
--  Le service_role bypassant automatiquement la RLS côté serveur, la suppression
--  des policies "anon" ferme hermétiquement l'accès direct depuis internet / navigateur
--  sans impacter le bon fonctionnement de l'application.
-- ============================================================

-- 1. S'assurer que le Row Level Security est activé sur chaque table
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;

-- 2. Révoquer les politiques trop permissives accordées au rôle 'anon'
DROP POLICY IF EXISTS "anon_all_transactions"      ON public.transactions;
DROP POLICY IF EXISTS "anon_all_favorites"         ON public.favorites;
DROP POLICY IF EXISTS "anon_all_settings"          ON public.settings;
DROP POLICY IF EXISTS "anon_all_portfolio_history" ON public.portfolio_history;

-- 3. (Optionnel) Vérification : aucune politique publique n'est active
-- Avec RLS activé et aucune policy 'anon', toute requête directe via la clé anon
-- sera rejetée par défaut (0 ligne retournée ou erreur 403/42501).
