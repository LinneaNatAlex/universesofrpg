import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminUser } from "@/lib/admin";
import { getPersonaByUsername } from "@/lib/personas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { User } from "@supabase/supabase-js";

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

/** Cookie session first; fall back to Authorization: Bearer for API calls from the browser. */
export async function getSessionUserFromRequest(
  request?: Request
): Promise<SessionUser | null> {
  const fromCookies = await getSessionUser();
  if (fromCookies) return fromCookies;

  if (!request) return null;

  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1]
    ?.trim();
  if (!token) return null;

  const service = createServiceClient();
  if (!service) return null;

  const {
    data: { user },
    error,
  } = await service.auth.getUser(token);
  if (error || !user) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    username: usernameFromUser(user),
  };
}

/** Full Supabase user (includes metadata) for age / policy checks. */
export async function getSupabaseUserFromRequest(
  request?: Request
): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return user;
  } catch {
    // Fall through to bearer token.
  }

  if (!request) return null;

  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1]
    ?.trim();
  if (!token) return null;

  const service = createServiceClient();
  if (!service) return null;

  const {
    data: { user },
    error,
  } = await service.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function requireSessionUser(request?: Request) {
  const user = await getSessionUserFromRequest(request);
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

/**
 * Resolve which buyer username marketplace purchases apply to.
 * Admins may buy as a demo persona; regular users always use their account username.
 */
export async function resolveBuyerUsername(
  actingUsername?: string | null,
  request?: Request
): Promise<
  | { ok: true; user: SessionUser; buyerUsername: string }
  | { ok: false; status: number; error: string }
> {
  const auth = await requireSessionUser(request);
  if (!auth.ok) return auth;

  const acting = actingUsername?.trim().toLowerCase();
  if (!acting || acting === auth.user.username) {
    return { ok: true, user: auth.user, buyerUsername: auth.user.username };
  }

  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (supabaseUser && isAdminUser(supabaseUser) && getPersonaByUsername(acting)) {
    return { ok: true, user: auth.user, buyerUsername: acting };
  }

  return {
    ok: false,
    status: 403,
    error: "You can only purchase as your own account or an admin demo persona.",
  };
}
