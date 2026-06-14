export interface OAuthSignupDraft {
  username: string;
  birthDate: string;
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
    const parsed = JSON.parse(raw) as OAuthSignupDraft & {
      birthYear?: number;
      age?: number;
    };
    let birthDate: string | null =
      typeof parsed.birthDate === "string" ? parsed.birthDate : null;
    if (!birthDate && typeof parsed.birthYear === "number") {
      birthDate = `${parsed.birthYear}-01-01`;
    }
    if (
      typeof parsed.username === "string" &&
      typeof birthDate === "string" &&
      typeof parsed.minorPurchaseAck === "boolean"
    ) {
      return {
        username: parsed.username,
        birthDate,
        minorPurchaseAck: parsed.minorPurchaseAck,
      };
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
