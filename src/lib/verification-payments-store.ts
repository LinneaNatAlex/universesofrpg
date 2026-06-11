import { readJson, writeJson } from "@/lib/browser-storage";
import { VERIFICATION_SUBSCRIPTION_CENTS } from "@/lib/currency";
import {
  grantVerifiedCreator,
  revokeVerifiedCreator,
} from "@/lib/verified-creators-store";

const STORAGE_KEY = "uorpg-verification-subscriptions";

export type VerificationSubscriptionStatus = "active" | "canceled" | "past_due";

export interface VerificationSubscription {
  username: string;
  amount_cents: number;
  status: VerificationSubscriptionStatus;
  current_period_end: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  started_at: string;
}

/** Legacy one-time payment shape (migrated on load). */
interface LegacyVerificationPayment {
  username: string;
  amount_cents: number;
  paid_at: string;
}

let subscriptions: VerificationSubscription[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function userKey(username: string) {
  return username.toLowerCase();
}

function migrateLegacy(rows: LegacyVerificationPayment[]): VerificationSubscription[] {
  return rows.map((row) => {
    const start = new Date(row.paid_at);
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    return {
      username: userKey(row.username),
      amount_cents: row.amount_cents,
      status: end > new Date() ? "active" : "canceled",
      current_period_end: end.toISOString(),
      stripe_subscription_id: null,
      stripe_customer_id: null,
      started_at: row.paid_at,
    };
  });
}

function load() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;

  const stored = readJson<VerificationSubscription[] | LegacyVerificationPayment[]>(
    STORAGE_KEY,
    []
  );

  if (stored.length === 0) {
    subscriptions = [];
    return;
  }

  const first = stored[0] as VerificationSubscription | LegacyVerificationPayment;
  if ("current_period_end" in first) {
    subscriptions = stored as VerificationSubscription[];
  } else {
    subscriptions = migrateLegacy(stored as LegacyVerificationPayment[]);
    persist();
  }
}

function ensureLoaded() {
  load();
}

function persist() {
  writeJson(STORAGE_KEY, subscriptions);
}

export function subscribeVerificationPayments(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAllVerificationSubscriptions(): VerificationSubscription[] {
  ensureLoaded();
  return [...subscriptions].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
}

export function getVerificationSubscription(
  username: string
): VerificationSubscription | null {
  ensureLoaded();
  return (
    subscriptions.find((s) => userKey(s.username) === userKey(username)) ?? null
  );
}

export function hasActiveVerificationSubscription(username: string): boolean {
  const sub = getVerificationSubscription(username);
  if (!sub) return false;
  if (sub.status !== "active") return false;
  return new Date(sub.current_period_end).getTime() > Date.now();
}

/** @deprecated Use hasActiveVerificationSubscription */
export function hasPaidVerificationFee(username: string): boolean {
  return hasActiveVerificationSubscription(username);
}

/** Demo — simulates an active month until Stripe Checkout is used. */
export function recordVerificationSubscriptionDemo(username: string): void {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);
  activateVerifiedCreatorSubscription({
    username,
    status: "active",
    current_period_end: periodEnd.toISOString(),
    stripe_subscription_id: null,
    stripe_customer_id: null,
  });
}

/** @deprecated Use recordVerificationSubscriptionDemo */
export function recordVerificationFeePayment(username: string): void {
  recordVerificationSubscriptionDemo(username);
}

export function upsertVerificationSubscriptionFromStripe(input: {
  username: string;
  amount_cents?: number;
  status: VerificationSubscriptionStatus;
  current_period_end: string;
  stripe_subscription_id: string | null;
  stripe_customer_id?: string | null;
}): void {
  ensureLoaded();
  const key = userKey(input.username);
  const existing = subscriptions.find((s) => userKey(s.username) === key);

  if (existing) {
    existing.status = input.status;
    existing.amount_cents = input.amount_cents ?? VERIFICATION_SUBSCRIPTION_CENTS;
    existing.current_period_end = input.current_period_end;
    existing.stripe_subscription_id = input.stripe_subscription_id;
    existing.stripe_customer_id = input.stripe_customer_id ?? existing.stripe_customer_id;
  } else {
    subscriptions = [
      {
        username: key,
        amount_cents: input.amount_cents ?? VERIFICATION_SUBSCRIPTION_CENTS,
        status: input.status,
        current_period_end: input.current_period_end,
        stripe_subscription_id: input.stripe_subscription_id,
        stripe_customer_id: input.stripe_customer_id ?? null,
        started_at: new Date().toISOString(),
      },
      ...subscriptions,
    ];
  }
  persist();
  notify();
}

/** Save subscription and grant or revoke the verified badge. */
export function activateVerifiedCreatorSubscription(input: {
  username: string;
  amount_cents?: number;
  status: VerificationSubscriptionStatus;
  current_period_end: string;
  stripe_subscription_id: string | null;
  stripe_customer_id?: string | null;
}): void {
  upsertVerificationSubscriptionFromStripe(input);
  const active =
    input.status === "active" &&
    new Date(input.current_period_end).getTime() > Date.now();
  if (active) {
    grantVerifiedCreator(input.username);
  } else {
    revokeVerifiedCreator(input.username);
  }
}

/** Drop verified access when a subscription lapses (demo personas unaffected). */
export function syncVerifiedCreatorAccess(username: string): void {
  if (hasActiveVerificationSubscription(username)) {
    grantVerifiedCreator(username);
  } else {
    revokeVerifiedCreator(username);
  }
}
