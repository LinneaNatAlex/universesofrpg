"use client";

import { useMarketplaceCheckoutReturn } from "@/hooks/useMarketplaceCheckoutReturn";

interface MarketplaceCheckoutReturnProps {
  sellerUsername?: string | null;
}

export function MarketplaceCheckoutReturn({
  sellerUsername,
}: MarketplaceCheckoutReturnProps) {
  const { confirming, error, successMessage, dismiss } =
    useMarketplaceCheckoutReturn(sellerUsername);

  if (!confirming && !error && !successMessage) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm border-2 border-ink shadow-[4px_4px_0_#1a1a2e] p-4 bg-white"
      role="status"
    >
      {confirming && (
        <p className="font-comic text-sm text-ink">Confirming your purchase…</p>
      )}
      {successMessage && (
        <p className="font-comic text-sm text-emerald-800">{successMessage}</p>
      )}
      {error && <p className="font-comic text-sm text-comic-red">{error}</p>}
      {(error || successMessage) && (
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 text-xs font-comic text-ink-muted hover:text-ink underline"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
