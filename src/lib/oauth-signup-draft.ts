export interface OAuthSignupDraft {
  username: string;
  birthDate: string;
  minorPurchaseAck: boolean;
}

const STORAGE_KEY = "uorpg_oauth_signup_draft";

function readRawDraft(): OAuthSignupDraft | null {
  if (typeof window === "undefined") return null;

  const sources = [
    sessionStorage.getItem(STORAGE_KEY),
    localStorage.getItem(STORAGE_KEY),
  ];

  for (const raw of sources) {
    if (!raw) continue;
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
      // try next source
    }
  }
  return null;
}

export function saveOAuthSignupDraft(draft: OAuthSignupDraft): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(draft);
  sessionStorage.setItem(STORAGE_KEY, raw);
  localStorage.setItem(STORAGE_KEY, raw);
}

export function readOAuthSignupDraft(): OAuthSignupDraft | null {
  return readRawDraft();
}

export function clearOAuthSignupDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
}
