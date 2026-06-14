/** Minimum age to create an account (years). */
export const MIN_ACCOUNT_AGE = 13;

/** Age at which users may purchase without parental consent acknowledgment. */
export const ADULT_PURCHASE_AGE = 18;

export const TERMS_VERSION = "2026-06";

export function parseUserAge(metadata: Record<string, unknown> | undefined): number | null {
  const raw = metadata?.age;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const age = Math.floor(raw);
    return age > 0 && age < 130 ? age : null;
  }
  if (typeof raw === "string" && raw.trim()) {
    const age = Math.floor(Number(raw));
    return Number.isFinite(age) && age > 0 && age < 130 ? age : null;
  }
  return null;
}

export function isValidSignupAge(age: number): boolean {
  return Number.isInteger(age) && age >= MIN_ACCOUNT_AGE && age <= 120;
}

export function isMinorForPurchases(age: number | null): boolean {
  return age != null && age >= MIN_ACCOUNT_AGE && age < ADULT_PURCHASE_AGE;
}

export function validateMarketplacePurchaseAge(
  age: number | null,
  parentalConsentAcknowledged: boolean
): { ok: true } | { ok: false; error: string } {
  if (age == null) {
    return {
      ok: false,
      error:
        "Your account is missing age information. Contact support or create a new account with your age on the signup form.",
    };
  }

  if (age < MIN_ACCOUNT_AGE) {
    return {
      ok: false,
      error: `Accounts require you to be at least ${MIN_ACCOUNT_AGE} years old.`,
    };
  }

  if (isMinorForPurchases(age) && !parentalConsentAcknowledged) {
    return {
      ok: false,
      error:
        "Parent or guardian approval is required for purchases when you are under 18. Confirm the checkbox before checkout.",
    };
  }

  return { ok: true };
}
