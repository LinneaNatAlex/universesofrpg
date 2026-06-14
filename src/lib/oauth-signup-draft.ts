export interface OAuthSignupDraft {
  username: string;
  age: number;
  minorPurchaseAck: boolean;
}

const STORAGE_KEY = "uorpg_oauth_signup_draft";

export function saveOAuthSignupDraft(draft: OAuthSignupDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function readOAuthSignupDraft(): OAuthSignupDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OAuthSignupDraft;
    if (
      typeof parsed.username === "string" &&
      typeof parsed.age === "number" &&
      typeof parsed.minorPurchaseAck === "boolean"
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupt draft
  }
  return null;
}

export function clearOAuthSignupDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
