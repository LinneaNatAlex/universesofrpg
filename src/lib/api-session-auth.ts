import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminUser, getAdminEmails } from "@/lib/admin";
import { getPersonaByUsername } from "@/lib/personas";
import { legacyBuyerUsernameAliases } from "@/lib/persona-rename";
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
}): string | null {
  const fromMeta = user.user_metadata?.username;
  if (typeof fromMeta === "string" && fromMeta.trim().length >= 3) {
    return fromMeta.trim().toLowerCase();
  }

  const emailLocal = user.email?.split("@")[0]?.trim().toLowerCase();
  if (emailLocal && emailLocal.length >= 3) {
    return emailLocal;
  }

  return `user_${user.id.replace(/-/g, "").slice(0, 12)}`;
}

async function usernameFromProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  fallback: string | null,
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  if (typeof data?.username === "string" && data.username.length >= 3) {
    return data.username.toLowerCase();
  }
  return fallback;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const metaUsername = usernameFromUser(user);
    const profileUsername = await usernameFromProfile(supabase, user.id, null);
    const username = profileUsername ?? metaUsername;
    if (!username) return null;

    return {
      id: user.id,
      email: user.email ?? null,
      username,
    };
  } catch {
    return null;
  }
}

/** Cookie session first; fall back to Authorization: Bearer for API calls from the browser. */
export async function getSessionUserFromRequest(
  request?: Request,
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

  const metaUsername = usernameFromUser(user);
  const profileUsername = await usernameFromProfile(service, user.id, null);
  const username = profileUsername ?? metaUsername;
  if (!username) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    username,
  };
}

/** Full Supabase user (includes metadata) for age / policy checks. */
export async function getSupabaseUserFromRequest(
  request?: Request,
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

function isAdminSession(user: SessionUser): boolean {
  if (!user.email) return false;
  const admins = getAdminEmails();
  return admins.length > 0 && admins.includes(user.email.toLowerCase());
}

async function isAdminFromRequest(
  user: SessionUser,
  request?: Request,
): Promise<boolean> {
  if (isAdminSession(user)) return true;
  const supabaseUser = await getSupabaseUserFromRequest(request);
  return isAdminUser(supabaseUser);
}

/**
 * Resolve which seller username Connect actions apply to.
 * Admins may pass a demo persona username while "posting as" them.
 */
export async function resolveSellerUsername(
  actingUsername?: string | null,
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

  if (
    (await isAdminFromRequest(auth.user, undefined)) &&
    getPersonaByUsername(acting)
  ) {
    return { ok: true, user: auth.user, sellerUsername: acting };
  }

  return {
    ok: false,
    status: 403,
    error: "You can only set up payouts for your own account.",
  };
}

async function buyerUsernameAliasesForUser(
  user: SessionUser,
): Promise<string[]> {
  const aliases = new Set<string>([user.username.toLowerCase()]);
  for (const leg of legacyBuyerUsernameAliases(user.username)) {
    aliases.add(leg);
  }

  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    if (typeof profile?.username === "string" && profile.username.length >= 3) {
      const profileUsername = profile.username.toLowerCase();
      aliases.add(profileUsername);
      for (const leg of legacyBuyerUsernameAliases(profileUsername)) {
        aliases.add(leg);
      }
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    const meta = authUser?.user_metadata?.username;
    if (typeof meta === "string" && meta.trim().length >= 3) {
      const metaUsername = meta.trim().toLowerCase();
      aliases.add(metaUsername);
      for (const leg of legacyBuyerUsernameAliases(metaUsername)) {
        aliases.add(leg);
      }
    }
  } catch {
    // offline or auth — session username only
  }

  return [...aliases];
}

/**
 * Resolve which buyer username marketplace purchases apply to.
 * Admin demo personas each have separate purchase records — buying as "chaz" does not unlock for "mira".
 */
export async function resolveBuyerUsername(
  actingUsername?: string | null,
  request?: Request,
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

  if (
    (await isAdminFromRequest(auth.user, request)) &&
    getPersonaByUsername(acting)
  ) {
    return { ok: true, user: auth.user, buyerUsername: acting };
  }

  const allowed = await buyerUsernameAliasesForUser(auth.user);
  if (allowed.includes(acting)) {
    return { ok: true, user: auth.user, buyerUsername: acting };
  }

  return {
    ok: false,
    status: 403,
    error:
      "You can only purchase as your own account or an admin demo persona.",
  };
}
