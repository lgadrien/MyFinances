import { createClient } from "@supabase/supabase-js";

// Safe retrieval of environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Basic validation to prevent immediate crashes if env vars are missing/invalid
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Fallback for development if credentials are missing
// This prevents the app from crashing on start, but database features won't work.
export const supabase =
  isValidUrl(supabaseUrl) && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient(
        "https://placeholder-project.supabase.co",
        "placeholder-key",
      );
