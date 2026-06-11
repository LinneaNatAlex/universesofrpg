import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";

export interface PlatformVerificationSubscription {
  username: string;
  status: "active" | "canceled" | "past_due";
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  amount_cents: number | null;
  started_at: string;
}

interface PlatformFileState {
  revoked: string[];
  subscriptions: PlatformVerificationSubscription[];
}

const DATA_PATH = join(process.cwd(), "data", "verification-platform.json");

function userKey(username: string) {
  return username.toLowerCase();
}

function emptyState(): PlatformFileState {
  return { revoked: [], subscriptions: [] };
}

function readFileState(): PlatformFileState {
  try {
    if (!existsSync(DATA_PATH)) return emptyState();
    const raw = readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as PlatformFileState;
    return {
      revoked: Array.isArray(parsed.revoked) ? parsed.revoked.map(userKey) : [],
      subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
    };
  } catch {
    return emptyState();
  }
}

function writeFileState(state: PlatformFileState): void {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(state, null, 2), "utf8");
}

export function isPlatformVerificationStoreConfigured(): boolean {
  return isServiceClientConfigured() || typeof window === "undefined";
}

export async function isUsernameRevokedOnPlatform(username: string): Promise<boolean> {
  const key = userKey(username);

  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { data, error } = await supabase
      .from("verification_revocations")
      .select("username")
      .eq("username", key)
      .maybeSingle();
    if (!error && data) return true;
    if (error) console.error("[verification-platform] revoke lookup failed", error);
    return false;
  }

  return readFileState().revoked.includes(key);
}

export async function getPlatformSubscription(
  username: string
): Promise<PlatformVerificationSubscription | null> {
  const key = userKey(username);

  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { data, error } = await supabase
      .from("verification_subscriptions")
      .select("*")
      .eq("username", key)
      .maybeSingle();
    if (error || !data) return null;
    return {
      username: data.username,
      status: data.status as PlatformVerificationSubscription["status"],
      current_period_end: data.current_period_end,
      stripe_subscription_id: data.stripe_subscription_id,
      stripe_customer_id: data.stripe_customer_id,
      amount_cents: data.amount_cents,
      started_at: data.started_at,
    };
  }

  return readFileState().subscriptions.find((s) => userKey(s.username) === key) ?? null;
}

export async function listPlatformRevokedUsernames(): Promise<string[]> {
  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { data, error } = await supabase
      .from("verification_revocations")
      .select("username")
      .order("revoked_at", { ascending: false });
    if (error) {
      console.error("[verification-platform] list revocations failed", error);
      return [];
    }
    return (data ?? []).map((row) => userKey(row.username));
  }

  return readFileState().revoked;
}

export async function listPlatformSubscriptions(): Promise<PlatformVerificationSubscription[]> {
  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { data, error } = await supabase
      .from("verification_subscriptions")
      .select("*")
      .order("started_at", { ascending: false });
    if (error) {
      console.error("[verification-platform] list subscriptions failed", error);
      return [];
    }
    return (data ?? []).map((row) => ({
      username: row.username,
      status: row.status as PlatformVerificationSubscription["status"],
      current_period_end: row.current_period_end,
      stripe_subscription_id: row.stripe_subscription_id,
      stripe_customer_id: row.stripe_customer_id,
      amount_cents: row.amount_cents,
      started_at: row.started_at,
    }));
  }

  return readFileState().subscriptions;
}

export async function adminRevokeOnPlatform(
  username: string,
  revokedBy?: string
): Promise<void> {
  const key = userKey(username);

  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { error: revokeError } = await supabase.from("verification_revocations").upsert({
      username: key,
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy ?? "admin",
    });
    if (revokeError) throw new Error(revokeError.message);

    const { error: deleteError } = await supabase
      .from("verification_subscriptions")
      .delete()
      .eq("username", key);
    if (deleteError) throw new Error(deleteError.message);
    return;
  }

  const state = readFileState();
  if (!state.revoked.includes(key)) state.revoked.push(key);
  state.subscriptions = state.subscriptions.filter((s) => userKey(s.username) !== key);
  writeFileState(state);
}

export async function upsertPlatformSubscription(
  input: PlatformVerificationSubscription
): Promise<void> {
  const key = userKey(input.username);

  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { error: deleteRevokeError } = await supabase
      .from("verification_revocations")
      .delete()
      .eq("username", key);
    if (deleteRevokeError) throw new Error(deleteRevokeError.message);

    const { error } = await supabase.from("verification_subscriptions").upsert({
      username: key,
      status: input.status,
      current_period_end: input.current_period_end,
      stripe_subscription_id: input.stripe_subscription_id,
      stripe_customer_id: input.stripe_customer_id,
      amount_cents: input.amount_cents,
      started_at: input.started_at,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return;
  }

  const state = readFileState();
  state.revoked = state.revoked.filter((u) => u !== key);
  const rest = state.subscriptions.filter((s) => userKey(s.username) !== key);
  state.subscriptions = [{ ...input, username: key }, ...rest];
  writeFileState(state);
}
