import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function createClient() {
  if (browserClient) return browserClient;

  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) {
    throw new Error("Supabase is not configured. Add keys to .env.local");
  }

  browserClient = createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      // Background refresh during dev HMR often hits a dead server → "Failed to fetch".
      autoRefreshToken: process.env.NODE_ENV !== "development",
    },
  });
  return browserClient;
}
