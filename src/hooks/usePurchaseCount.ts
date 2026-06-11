"use client";

import { useEffect, useState } from "react";
import {
  PURCHASES_UPDATED_EVENT,
  subscribePurchases,
} from "@/lib/purchases-store";

export function usePurchaseCount(postId: string, enabled = true): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || !postId) {
      setCount(null);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/marketplace/purchase-count?post_id=${encodeURIComponent(postId)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (!cancelled && typeof data.count === "number") {
          setCount(Math.max(0, data.count));
        }
      } catch {
        // offline — keep last value
      }
    }

    void load();

    const onPurchasesUpdated = () => void load();
    const unsub = subscribePurchases(onPurchasesUpdated);
    window.addEventListener(PURCHASES_UPDATED_EVENT, onPurchasesUpdated);

    return () => {
      cancelled = true;
      unsub();
      window.removeEventListener(PURCHASES_UPDATED_EVENT, onPurchasesUpdated);
    };
  }, [postId, enabled]);

  return count;
}
