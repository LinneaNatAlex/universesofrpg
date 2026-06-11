/** Stripe Payment Link for verified creator — override with env in production if needed. */
export const DEFAULT_VERIFICATION_PAYMENT_LINK =
  "https://buy.stripe.com/7sY9AMaUB5JS1rd2Zt3VC01";

export function getVerificationPaymentLink(): string {
  const fromEnv = process.env.NEXT_PUBLIC_STRIPE_VERIFICATION_PAYMENT_LINK?.trim();
  return fromEnv || DEFAULT_VERIFICATION_PAYMENT_LINK;
}

/** Demo subscribe without Stripe — off by default; set NEXT_PUBLIC_ALLOW_DEMO_VERIFICATION_SUBSCRIBE=true locally. */
export function isDemoVerificationSubscribeAllowed(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_DEMO_VERIFICATION_SUBSCRIBE === "true";
}
