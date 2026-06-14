"use client";

import { useState } from "react";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useAccountAge } from "@/hooks/useAccountAge";
import {
  demoUnlockPurchase,
  startMarketplaceCheckout,
  type MarketplaceCheckoutItem,
} from "@/lib/marketplace-checkout";
import { validateMarketplacePurchaseAge } from "@/lib/account-age";

const ALLOW_DEMO =
  process.env.NEXT_PUBLIC_ALLOW_DEMO_MARKETPLACE_PURCHASE === "true";

/** redirecting = Stripe checkout opened; unlocked = demo/dev only after confirmed unlock */
export type MarketplaceBuyResult = "redirecting" | "unlocked" | "failed";

export function useMarketplaceBuy() {
  const identity = useActingIdentity();
  const { age, isMinor, missingAge } = useAccountAge();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy(
    item: MarketplaceCheckoutItem,
    parentalConsentAcknowledged = false
  ): Promise<MarketplaceBuyResult> {
    const buyerUsername = identity?.username;
    if (!buyerUsername) {
      setError("Sign in to purchase.");
      return "failed";
    }

    const ageCheck = validateMarketplacePurchaseAge(age, parentalConsentAcknowledged);
    if (!ageCheck.ok) {
      setError(ageCheck.error);
      return "failed";
    }

    setBusy(true);
    setError(null);

    const result = await startMarketplaceCheckout(
      item,
      buyerUsername,
      isMinor ? parentalConsentAcknowledged : false
    );

    if (result.ok) {
      // Redirecting to Stripe — payment is NOT complete yet.
      return "redirecting";
    }

    if (
      ALLOW_DEMO &&
      (result.error.includes("not configured") ||
        result.error.includes("payouts") ||
        result.error.includes("Stripe"))
    ) {
      demoUnlockPurchase(buyerUsername, item.post_id);
      setBusy(false);
      return "unlocked";
    }

    setError(result.error);
    setBusy(false);
    return "failed";
  }

  return { buy, busy, error, clearError: () => setError(null), isMinor, missingAge, age };
}
