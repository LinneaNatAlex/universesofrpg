import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/supabase/env";

export function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) {
    throw new Error("Supabase is not configured. Add keys to .env.local");
  }
  return createBrowserClient(url, key);
}
