import { savePendingMarketplaceCheckout } from "@/lib/marketplace-checkout-pending";
import { recordPurchase } from "@/lib/purchases-store";

export interface MarketplaceCheckoutItem {
  post_id: string;
  title: string;
  price_cents: number;
  seller_username: string;
}

export async function startMarketplaceCheckout(
  item: MarketplaceCheckoutItem,
  buyingAsUsername?: string | null,
  parentalConsentAcknowledged = false
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/stripe/marketplace-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...item,
        buying_as_username: buyingAsUsername ?? undefined,
        parental_consent_acknowledged: parentalConsentAcknowledged,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      url?: string;
    };

    if (!res.ok) {
      return { ok: false, error: data.error ?? "Could not start checkout." };
    }

    if (!data.url) {
      return { ok: false, error: "Stripe checkout URL missing." };
    }

    savePendingMarketplaceCheckout(
      item.post_id,
      item.seller_username,
      buyingAsUsername?.trim().toLowerCase() ?? ""
    );
    window.location.href = data.url;
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error — could not reach checkout." };
  }
}

/** Local demo unlock when Stripe is not configured (dev only). */
export function demoUnlockPurchase(username: string, postId: string): void {
  recordPurchase(username, postId);
}
