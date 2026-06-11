"use client";

import { useState } from "react";
import {
  demoUnlockPurchase,
  startMarketplaceCheckout,
  type MarketplaceCheckoutItem,
} from "@/lib/marketplace-checkout";

const ALLOW_DEMO =
  process.env.NEXT_PUBLIC_ALLOW_DEMO_MARKETPLACE_PURCHASE === "true";

export function useMarketplaceBuy() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy(
    item: MarketplaceCheckoutItem,
    buyerUsername: string,
    onSuccess?: () => void
  ): Promise<boolean> {
    setBusy(true);
    setError(null);

    const result = await startMarketplaceCheckout(item);

    if (result.ok) {
      return true;
    }

    if (
      ALLOW_DEMO &&
      (result.error.includes("not configured") ||
        result.error.includes("payouts") ||
        result.error.includes("Stripe"))
    ) {
      demoUnlockPurchase(buyerUsername, item.post_id);
      onSuccess?.();
      setBusy(false);
      return true;
    }

    setError(result.error);
    setBusy(false);
    return false;
  }

  return { buy, busy, error, clearError: () => setError(null) };
}
