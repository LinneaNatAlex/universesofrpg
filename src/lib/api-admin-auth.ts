import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function requireAdminApiUser() {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, status: 503, error: "Auth is not configured" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, status: 401, error: "Sign in required" };
  }

  if (!isAdminUser(user)) {
    return { ok: false as const, status: 403, error: "Admin access required" };
  }

  return { ok: true as const, user };
}
