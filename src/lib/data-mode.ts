import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Where app data (posts, comments, forum, etc.) is persisted.
 *
 * - `local`  — browser localStorage only. Default. Safe while building UI;
 *              nothing touches Supabase tables.
 * - `supabase` — repositories may write to the database, but only through
 *              explicit "publish" / admin actions — never on every keystroke.
 *
 * Auth (login/signup) always uses Supabase when configured, regardless of mode.
 */
export type DataMode = "local" | "supabase";

export function getDataMode(): DataMode {
  if (
    process.env.NEXT_PUBLIC_DATA_MODE === "supabase" &&
    isSupabaseConfigured()
  ) {
    return "supabase";
  }
  return "local";
}

export function isLocalDataMode(): boolean {
  return getDataMode() === "local";
}

/** Gate for code paths that INSERT/UPDATE Supabase tables. */
export function canPersistToDatabase(): boolean {
  return getDataMode() === "supabase";
}
