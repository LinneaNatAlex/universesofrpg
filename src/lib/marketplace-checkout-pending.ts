const STORAGE_KEY = "uorpg_marketplace_checkout_pending";

export interface PendingMarketplaceCheckout {
  post_id: string;
  seller_username: string;
  buyer_username: string;
  started_at: string;
}

export function savePendingMarketplaceCheckout(
  postId: string,
  sellerUsername: string,
  buyerUsername: string
): void {
  if (typeof window === "undefined") return;
  const payload: PendingMarketplaceCheckout = {
    post_id: postId,
    seller_username: sellerUsername.toLowerCase(),
    buyer_username: buyerUsername.toLowerCase(),
    started_at: new Date().toISOString(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function readPendingMarketplaceCheckout(): PendingMarketplaceCheckout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingMarketplaceCheckout;
    if (!parsed.post_id || !parsed.seller_username) return null;
    return {
      ...parsed,
      seller_username: parsed.seller_username.toLowerCase(),
      buyer_username: (parsed.buyer_username ?? "").toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function clearPendingMarketplaceCheckout(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
