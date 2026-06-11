import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";

export interface ConnectAccountRecord {
  username: string;
  stripe_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  updated_at: string;
}

export interface PlatformPurchase {
  buyer_username: string;
  post_id: string;
  seller_username: string;
  amount_cents: number;
  platform_fee_cents: number;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  purchased_at: string;
}

interface MarketplaceFileState {
  connectAccounts: ConnectAccountRecord[];
  purchases: PlatformPurchase[];
}

const DATA_PATH = join(process.cwd(), "data", "marketplace-platform.json");

function userKey(username: string) {
  return username.toLowerCase();
}

function emptyState(): MarketplaceFileState {
  return { connectAccounts: [], purchases: [] };
}

function readFileState(): MarketplaceFileState {
  try {
    if (!existsSync(DATA_PATH)) return emptyState();
    const raw = readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as MarketplaceFileState;
    return {
      connectAccounts: Array.isArray(parsed.connectAccounts) ? parsed.connectAccounts : [],
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
    };
  } catch {
    return emptyState();
  }
}

function writeFileState(state: MarketplaceFileState): void {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(state, null, 2), "utf8");
}

export async function getConnectAccount(
  username: string
): Promise<ConnectAccountRecord | null> {
  const key = userKey(username);

  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { data, error } = await supabase
      .from("marketplace_connect_accounts")
      .select("*")
      .eq("username", key)
      .maybeSingle();
    if (error || !data) return null;
    return {
      username: data.username,
      stripe_account_id: data.stripe_account_id,
      charges_enabled: Boolean(data.charges_enabled),
      payouts_enabled: Boolean(data.payouts_enabled),
      details_submitted: Boolean(data.details_submitted),
      updated_at: data.updated_at,
    };
  }

  return (
    readFileState().connectAccounts.find((a) => userKey(a.username) === key) ?? null
  );
}

export async function getConnectAccountByStripeId(
  stripeAccountId: string
): Promise<ConnectAccountRecord | null> {
  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { data, error } = await supabase
      .from("marketplace_connect_accounts")
      .select("*")
      .eq("stripe_account_id", stripeAccountId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      username: data.username,
      stripe_account_id: data.stripe_account_id,
      charges_enabled: Boolean(data.charges_enabled),
      payouts_enabled: Boolean(data.payouts_enabled),
      details_submitted: Boolean(data.details_submitted),
      updated_at: data.updated_at,
    };
  }

  return (
    readFileState().connectAccounts.find((a) => a.stripe_account_id === stripeAccountId) ??
    null
  );
}

export async function deleteConnectAccount(username: string): Promise<void> {
  const key = userKey(username);

  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { error } = await supabase
      .from("marketplace_connect_accounts")
      .delete()
      .eq("username", key);
    if (error) throw new Error(error.message);
    return;
  }

  const state = readFileState();
  state.connectAccounts = state.connectAccounts.filter((a) => userKey(a.username) !== key);
  writeFileState(state);
}

export async function upsertConnectAccount(
  input: ConnectAccountRecord
): Promise<void> {
  const key = userKey(input.username);
  const row = { ...input, username: key, updated_at: new Date().toISOString() };

  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { error } = await supabase.from("marketplace_connect_accounts").upsert({
      username: key,
      stripe_account_id: row.stripe_account_id,
      charges_enabled: row.charges_enabled,
      payouts_enabled: row.payouts_enabled,
      details_submitted: row.details_submitted,
      updated_at: row.updated_at,
    });
    if (error) throw new Error(error.message);

    void supabase
      .from("profiles")
      .update({ stripe_account_id: row.stripe_account_id })
      .eq("username", key);
    return;
  }

  const state = readFileState();
  const rest = state.connectAccounts.filter((a) => userKey(a.username) !== key);
  state.connectAccounts = [row, ...rest];
  writeFileState(state);
}

export async function recordPlatformPurchase(
  input: PlatformPurchase
): Promise<void> {
  const buyer = userKey(input.buyer_username);
  const postId = input.post_id;

  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { error } = await supabase.from("marketplace_purchases").upsert({
      buyer_username: buyer,
      post_id: postId,
      seller_username: userKey(input.seller_username),
      amount_cents: input.amount_cents,
      platform_fee_cents: input.platform_fee_cents,
      stripe_checkout_session_id: input.stripe_checkout_session_id,
      stripe_payment_intent_id: input.stripe_payment_intent_id,
      purchased_at: input.purchased_at,
    });
    if (error) throw new Error(error.message);
    return;
  }

  const state = readFileState();
  const rest = state.purchases.filter(
    (p) => !(userKey(p.buyer_username) === buyer && p.post_id === postId)
  );
  state.purchases = [
    {
      ...input,
      buyer_username: buyer,
      seller_username: userKey(input.seller_username),
    },
    ...rest,
  ];
  writeFileState(state);
}

export async function hasPlatformPurchase(
  buyerUsername: string,
  postId: string
): Promise<boolean> {
  const buyer = userKey(buyerUsername);

  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { data, error } = await supabase
      .from("marketplace_purchases")
      .select("post_id")
      .eq("buyer_username", buyer)
      .eq("post_id", postId)
      .maybeSingle();
    if (error) {
      console.error("[marketplace-platform] purchase lookup failed", error);
      return false;
    }
    return Boolean(data);
  }

  return readFileState().purchases.some(
    (p) => userKey(p.buyer_username) === buyer && p.post_id === postId
  );
}

export async function listPlatformPurchasesForBuyer(
  buyerUsername: string
): Promise<PlatformPurchase[]> {
  const buyer = userKey(buyerUsername);

  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { data, error } = await supabase
      .from("marketplace_purchases")
      .select("*")
      .eq("buyer_username", buyer)
      .order("purchased_at", { ascending: false });
    if (error) {
      console.error("[marketplace-platform] list purchases failed", error);
      return [];
    }
    return (data ?? []).map((row) => ({
      buyer_username: row.buyer_username,
      post_id: row.post_id,
      seller_username: row.seller_username,
      amount_cents: row.amount_cents,
      platform_fee_cents: row.platform_fee_cents,
      stripe_checkout_session_id: row.stripe_checkout_session_id,
      stripe_payment_intent_id: row.stripe_payment_intent_id,
      purchased_at: row.purchased_at,
    }));
  }

  return readFileState().purchases.filter((p) => userKey(p.buyer_username) === buyer);
}

export async function countPlatformPurchasesForPost(postId: string): Promise<number> {
  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { count, error } = await supabase
      .from("marketplace_purchases")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);
    if (error) {
      console.error("[marketplace-platform] purchase count failed", error);
      return 0;
    }
    return count ?? 0;
  }

  return readFileState().purchases.filter((p) => p.post_id === postId).length;
}

export async function countPlatformPurchasesForPosts(
  postIds: string[]
): Promise<Record<string, number>> {
  const unique = [...new Set(postIds.filter(Boolean))];
  const counts: Record<string, number> = {};
  for (const id of unique) counts[id] = 0;
  if (unique.length === 0) return counts;

  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { data, error } = await supabase
      .from("marketplace_purchases")
      .select("post_id")
      .in("post_id", unique);
    if (error) {
      console.error("[marketplace-platform] batch purchase count failed", error);
      return counts;
    }
    for (const row of data ?? []) {
      counts[row.post_id] = (counts[row.post_id] ?? 0) + 1;
    }
    return counts;
  }

  for (const purchase of readFileState().purchases) {
    if (unique.includes(purchase.post_id)) {
      counts[purchase.post_id] = (counts[purchase.post_id] ?? 0) + 1;
    }
  }
  return counts;
}
