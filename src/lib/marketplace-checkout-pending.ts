const STORAGE_KEY = "uorpg_marketplace_checkout_pending";

export interface PendingMarketplaceCheckout {
  post_id: string;
  seller_username: string;
  started_at: string;
}

export function savePendingMarketplaceCheckout(
  postId: string,
  sellerUsername: string
): void {
  if (typeof window === "undefined") return;
  const payload: PendingMarketplaceCheckout = {
    post_id: postId,
    seller_username: sellerUsername.toLowerCase(),
    started_at: new Date().toISOString(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function readPendingMarketplaceCheckout(): PendingMarketplaceCheckout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingMarketplaceCheckout;
  } catch {
    return null;
  }
}

export function clearPendingMarketplaceCheckout(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
