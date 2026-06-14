/** Minimum age to create an account (years). */
export const MIN_ACCOUNT_AGE = 13;

/** Age at which users may purchase without parental consent acknowledgment. */
export const ADULT_PURCHASE_AGE = 18;

export const TERMS_VERSION = "2026-06";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function currentCalendarYear(): number {
  return new Date().getFullYear();
}

function toIsoDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIsoDateParts(iso: string): { y: number; m: number; d: number } | null {
  if (!ISO_DATE_RE.test(iso)) return null;
  const [y, m, d] = iso.split("-").map((part) => Number(part));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

/** Latest birth date for minimum account age (turned 13 today or earlier). */
export function maxSignupBirthDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_ACCOUNT_AGE);
  return toIsoDateLocal(d);
}

/** Oldest birth date we accept (roughly 120 years). */
export function minSignupBirthDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 120);
  return toIsoDateLocal(d);
}

export function parseBirthDate(
  metadata: Record<string, unknown> | undefined
): string | null {
  const raw = metadata?.birth_date ?? metadata?.birthDate;
  if (typeof raw === "string" && ISO_DATE_RE.test(raw.trim())) {
    const date = raw.trim();
    const age = ageFromBirthDate(date);
    if (age != null && age >= MIN_ACCOUNT_AGE && age <= 120) return date;
  }
  return null;
}

/** Legacy birth year only — used when migrating old accounts. */
export function parseBirthYear(
  metadata: Record<string, unknown> | undefined
): number | null {
  const raw = metadata?.birth_year ?? metadata?.birthYear;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const year = Math.floor(raw);
    return year >= Number(minSignupBirthDate().slice(0, 4)) &&
      year <= currentCalendarYear()
      ? year
      : null;
  }
  if (typeof raw === "string" && raw.trim()) {
    const year = Math.floor(Number(raw));
    return Number.isFinite(year) ? year : null;
  }
  return null;
}

export function ageFromBirthDate(birthDate: string): number | null {
  const parts = parseIsoDateParts(birthDate);
  if (!parts) return null;
  const today = new Date();
  let age = today.getFullYear() - parts.y;
  const monthDelta = today.getMonth() + 1 - parts.m;
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < parts.d)) {
    age -= 1;
  }
  return age > 0 && age < 130 ? age : null;
}

export function ageFromBirthYear(birthYear: number): number {
  return currentCalendarYear() - birthYear;
}

export function isValidSignupBirthDate(birthDate: string): boolean {
  const parts = parseIsoDateParts(birthDate);
  if (!parts) return false;

  const today = new Date();
  const born = new Date(parts.y, parts.m - 1, parts.d);
  if (born.getTime() > today.getTime()) return false;

  const age = ageFromBirthDate(birthDate);
  if (age == null) return false;
  return age >= MIN_ACCOUNT_AGE && age <= 120;
}

/** @deprecated Legacy year-only field. */
export function isValidSignupBirthYear(birthYear: number): boolean {
  return (
    Number.isInteger(birthYear) &&
    birthYear >= Number(minSignupBirthDate().slice(0, 4)) &&
    birthYear <= Number(maxSignupBirthDate().slice(0, 4))
  );
}

/** Derives age from birth date/year; falls back to legacy `age` metadata. */
export function parseUserAge(metadata: Record<string, unknown> | undefined): number | null {
  const birthDate = parseBirthDate(metadata);
  if (birthDate) {
    return ageFromBirthDate(birthDate);
  }

  const birthYear = parseBirthYear(metadata);
  if (birthYear != null) {
    const age = ageFromBirthYear(birthYear);
    return age > 0 && age < 130 ? age : null;
  }

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

/** @deprecated Use isValidSignupBirthDate — kept for internal migration reads. */
export function isValidSignupAge(age: number): boolean {
  return Number.isInteger(age) && age >= MIN_ACCOUNT_AGE && age <= 120;
}

export function isMinorForPurchases(age: number | null): boolean {
  return age != null && age >= MIN_ACCOUNT_AGE && age < ADULT_PURCHASE_AGE;
}

export function isMinorForPurchasesFromBirthDate(birthDate: string | null): boolean {
  if (!birthDate) return false;
  return isMinorForPurchases(ageFromBirthDate(birthDate));
}

export function validateMarketplacePurchaseAge(
  age: number | null,
  parentalConsentAcknowledged: boolean
): { ok: true } | { ok: false; error: string } {
  if (age == null) {
    return {
      ok: false,
      error:
        "Your account is missing birth-date information. Update your account or contact support.",
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
