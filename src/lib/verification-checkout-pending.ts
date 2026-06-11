const STORAGE_KEY = "uorpg_verification_checkout";
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

interface PendingCheckout {
  username: string;
  email?: string;
  at: number;
}

export function savePendingVerificationCheckout(username: string, email?: string): void {
  if (typeof window === "undefined") return;
  const payload: PendingCheckout = {
    username: username.toLowerCase(),
    email: email?.trim() || undefined,
    at: Date.now(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function readPendingVerificationCheckout(): Omit<PendingCheckout, "at"> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingCheckout;
    if (!parsed.username || Date.now() - parsed.at > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { username: parsed.username.toLowerCase(), email: parsed.email };
  } catch {
    return null;
  }
}

export function clearPendingVerificationCheckout(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
