import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin";
import { getPersonaByUsername } from "@/lib/personas";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface SessionUser {
  id: string;
  email: string | null;
  username: string;
}

function usernameFromUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const fromMeta = user.user_metadata?.username;
  if (typeof fromMeta === "string" && fromMeta.trim()) {
    return fromMeta.trim().toLowerCase();
  }
  const fromEmail = user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return fromEmail && fromEmail.length >= 3 ? fromEmail : "adventurer";
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    return {
      id: user.id,
      email: user.email ?? null,
      username: usernameFromUser(user),
    };
  } catch {
    return null;
  }
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false as const, status: 401, error: "Sign in required" };
  }
  return { ok: true as const, user };
}

/**
 * Resolve which seller username Connect actions apply to.
 * Admins may pass a demo persona username while "posting as" them.
 */
export async function resolveSellerUsername(
  actingUsername?: string | null
): Promise<
  | { ok: true; user: SessionUser; sellerUsername: string }
  | { ok: false; status: number; error: string }
> {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth;

  const acting = actingUsername?.trim().toLowerCase();
  if (!acting) {
    return { ok: true, user: auth.user, sellerUsername: auth.user.username };
  }

  if (acting === auth.user.username) {
    return { ok: true, user: auth.user, sellerUsername: acting };
  }

  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (supabaseUser && isAdminUser(supabaseUser) && getPersonaByUsername(acting)) {
    return { ok: true, user: auth.user, sellerUsername: acting };
  }

  return {
    ok: false,
    status: 403,
    error: "You can only set up payouts for your own account.",
  };
}
