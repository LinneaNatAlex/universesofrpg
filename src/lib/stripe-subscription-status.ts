import type { VerificationSubscriptionStatus } from "@/lib/verification-payments-store";

export function mapStripeSubscriptionStatus(
  status: string
): VerificationSubscriptionStatus {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  return "canceled";
}

export function stripePeriodEndIso(sub: unknown): string {
  const end =
    sub &&
    typeof sub === "object" &&
    "current_period_end" in sub &&
    typeof (sub as { current_period_end: unknown }).current_period_end === "number"
      ? (sub as { current_period_end: number }).current_period_end
      : null;
  return end ? new Date(end * 1000).toISOString() : new Date().toISOString();
}
