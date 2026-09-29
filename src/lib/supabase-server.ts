/**
 * src/lib/supabase-server.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Client Supabase côté SERVEUR uniquement (service_role key).
 *
 * ⚠️  NE JAMAIS importer ce fichier dans un composant client ou un hook React.
 *     Utiliser uniquement dans les API Routes Next.js.
 *
 * Le service_role key :
 *   - Bypasse la RLS (Row Level Security) entièrement
 *   - N'est JAMAIS exposé au navigateur (pas de préfixe NEXT_PUBLIC_)
 *   - Permet d'effectuer toutes les opérations DB en toute sécurité côté serveur
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!serviceRoleKey) {
  console.error(
    "[supabase-server] SUPABASE_SERVICE_ROLE_KEY is not set — " +
      "all server-side DB operations will fail. " +
      "Add it to your .env.local and Vercel Environment Variables.",
  );
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const supabaseAdmin = createClient(
  isValidUrl(supabaseUrl) ? supabaseUrl : "https://placeholder.supabase.co",
  serviceRoleKey || "placeholder-service-role-key",
  {
    auth: {
      // Désactiver la gestion de session côté serveur (inutile pour service_role)
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

