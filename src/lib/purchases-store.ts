type Listener = () => void;
const listeners = new Set<Listener>();

export const PURCHASES_UPDATED_EVENT = "uorpg-purchases-updated";
export const PURCHASE_CONFIRMED_EVENT = "uorpg-purchase-confirmed";

export interface PurchaseConfirmedDetail {
  username: string;
  postId: string;
}

const purchasedByUser = new Map<string, Set<string>>();
const hydrationStarted = new Set<string>();

function notify() {
  listeners.forEach((l) => l());
}

function storageKey(username: string) {
  return `uorpg-purchases:${username.toLowerCase()}`;
}

function getPurchasedSet(username: string): Set<string> {
  const key = username.toLowerCase();
  if (!purchasedByUser.has(key)) {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(storageKey(key));
        purchasedByUser.set(key, new Set(raw ? (JSON.parse(raw) as string[]) : []));
      } catch {
        purchasedByUser.set(key, new Set());
      }
    } else {
      purchasedByUser.set(key, new Set());
    }
  }
  return purchasedByUser.get(key)!;
}

function persist(username: string) {
  if (typeof window === "undefined") return;
  const set = getPurchasedSet(username);
  localStorage.setItem(storageKey(username), JSON.stringify([...set]));
}

export function subscribePurchases(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasPurchased(username: string, postId: string): boolean {
  return getPurchasedSet(username).has(postId);
}

export function getPurchasedPostIds(username: string): string[] {
  return [...getPurchasedSet(username)];
}

/** Replace local cache with the server-confirmed purchase list (removes stale entries). */
export function setServerPurchasedPostIds(username: string, postIds: string[]): void {
  const key = username.toLowerCase();
  const next = new Set(postIds);
  const prev = getPurchasedSet(key);
  const changed =
    next.size !== prev.size || [...next].some((id) => !prev.has(id));
  purchasedByUser.set(key, next);
  if (changed) {
    persist(key);
    notify();
  }
}

/** @deprecated Prefer setServerPurchasedPostIds — this only adds and never removes stale ids. */
export function syncPurchasedPostIds(username: string, postIds: string[]): void {
  setServerPurchasedPostIds(username, postIds);
}

export function recordPurchase(username: string, postId: string): void {
  const key = username.toLowerCase();
  const set = getPurchasedSet(key);
  if (set.has(postId)) return;
  set.add(postId);
  persist(key);
  notify();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PURCHASES_UPDATED_EVENT));
    window.dispatchEvent(
      new CustomEvent<PurchaseConfirmedDetail>(PURCHASE_CONFIRMED_EVENT, {
        detail: { username: key, postId },
      })
    );
  }
}

export function revokePurchase(username: string, postId: string): void {
  const set = getPurchasedSet(username);
  if (!set.delete(postId)) return;
  persist(username);
  notify();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PURCHASES_UPDATED_EVENT));
  }
}

/** Merge server-side purchases (Stripe) into local cache for this user. */
export async function hydratePurchasesFromServer(username: string): Promise<void> {
  const key = username.toLowerCase();
  if (typeof window === "undefined") return;

  try {
    const { authFetchHeaders } = await import("@/lib/api-client-auth");
    const headers = await authFetchHeaders();
    const url = new URL("/api/marketplace/purchases", window.location.origin);
    url.searchParams.set("acting_username", username);
    const res = await fetch(url.toString(), {
      credentials: "include",
      headers,
      cache: "no-store",
    });
    if (!res.ok) return;

    const data = (await res.json()) as { post_ids?: string[] };
    const postIds = data.post_ids ?? [];
    // Only replace local cache when the server returns rows — empty may be lag or a username mismatch.
    if (postIds.length > 0) {
      setServerPurchasedPostIds(key, postIds);
    }
  } catch {
    // offline or auth — keep local cache
  }
}

export function ensurePurchasesHydrated(username: string | null): void {
  if (!username || typeof window === "undefined") return;
  const key = username.toLowerCase();
  if (hydrationStarted.has(key)) return;
  hydrationStarted.add(key);
  void hydratePurchasesFromServer(key);
}
