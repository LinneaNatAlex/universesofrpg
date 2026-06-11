/** Platform currency — all shop and verification fees are in US dollars. */
export const SITE_CURRENCY = "USD" as const;

/** Verified creator subscription — $9.00 per month. */
export const VERIFICATION_SUBSCRIPTION_CENTS = 900;

/** @deprecated Use VERIFICATION_SUBSCRIPTION_CENTS */
export const VERIFICATION_FEE_CENTS = VERIFICATION_SUBSCRIPTION_CENTS;

/** Format cents as USD (always $, never locale currency). */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatPricePerMonth(cents: number): string {
  return `${formatPrice(cents)}/mo`;
}
