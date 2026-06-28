"use client";

import { useEffect, useState } from "react";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import {
  clearPendingMarketplaceCheckout,
  readPendingMarketplaceCheckout,
} from "@/lib/marketplace-checkout-pending";
import {
  recordPurchase,
  PURCHASES_UPDATED_EVENT,
  revokePurchase,
} from "@/lib/purchases-store";

const PROCESSED_SESSION_KEY = "uorpg_marketplace_processed_session";

export interface MarketplaceCheckoutReturnState {
  confirming: boolean;
  error: string | null;
  successMessage: string | null;
  dismiss: () => void;
}

export function useMarketplaceCheckoutReturn(
  sellerUsername?: string | null
): MarketplaceCheckoutReturnState {
  const identity = useActingIdentity();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchase = params.get("purchase");
    const sessionId = params.get("session_id")?.trim();

    function cleanUrl() {
      params.delete("purchase");
      params.delete("session_id");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname
      );
    }

    if (purchase === "canceled") {
      const pending = readPendingMarketplaceCheckout();
      const buyer = identity?.username;
      if (pending && buyer) {
        revokePurchase(buyer, pending.post_id);
      }
      setError("Checkout was canceled. You were not charged.");
      clearPendingMarketplaceCheckout();
      cleanUrl();
      return;
    }

    if (purchase !== "success" || !sessionId) return;

    if (sessionStorage.getItem(PROCESSED_SESSION_KEY) === sessionId) {
      cleanUrl();
      return;
    }

    const pending = readPendingMarketplaceCheckout();
    const seller =
      sellerUsername?.toLowerCase() ??
      pending?.seller_username ??
      null;

    if (!seller) {
      setError("Could not confirm purchase — seller info missing.");
      cleanUrl();
      return;
    }

    setConfirming(true);
    setError(null);

    const url = new URL("/api/stripe/marketplace-session", window.location.origin);
    url.searchParams.set("session_id", sessionId);
    url.searchParams.set("seller_username", seller);

    fetch(url.toString(), { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          buyer_username?: string;
          post_id?: string;
          already_recorded?: boolean;
        };

        if (!res.ok) {
          throw new Error(data.error ?? "Could not confirm purchase.");
        }

        const postId = data.post_id ?? pending?.post_id;
        const buyer =
          data.buyer_username?.trim().toLowerCase() ||
          pending?.buyer_username ||
          identity?.username?.toLowerCase();
        if (postId && buyer) {
          recordPurchase(buyer, postId);
        }

        sessionStorage.setItem(PROCESSED_SESSION_KEY, sessionId);
        clearPendingMarketplaceCheckout();
        window.dispatchEvent(new Event(PURCHASES_UPDATED_EVENT));
        setSuccessMessage(
          data.already_recorded
            ? "Purchase already unlocked."
            : "Purchase confirmed — content unlocked."
        );
        cleanUrl();
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not confirm purchase.");
        cleanUrl();
      })
      .finally(() => setConfirming(false));
  }, [sellerUsername, identity?.username]);

  return {
    confirming,
    error,
    successMessage,
    dismiss: () => {
      setError(null);
      setSuccessMessage(null);
    },
  };
}
