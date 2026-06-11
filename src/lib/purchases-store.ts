type Listener = () => void;
const listeners = new Set<Listener>();

const purchasedByUser = new Map<string, Set<string>>();

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
}
