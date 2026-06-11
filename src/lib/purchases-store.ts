type Listener = () => void;
const listeners = new Set<Listener>();

export const PURCHASES_UPDATED_EVENT = "uorpg-purchases-updated";

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

export function recordPurchase(username: string, postId: string): void {
  const set = getPurchasedSet(username);
  set.add(postId);
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
    const res = await fetch("/api/marketplace/purchases", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return;

    const data = (await res.json()) as { post_ids?: string[] };
    const set = getPurchasedSet(key);
    let changed = false;
    for (const postId of data.post_ids ?? []) {
      if (!set.has(postId)) {
        set.add(postId);
        changed = true;
      }
    }
    if (changed) {
      persist(key);
      notify();
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
