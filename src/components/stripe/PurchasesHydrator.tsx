"use client";

import { useEffect } from "react";
import { useAccountIdentity } from "@/hooks/useAccountIdentity";
import { ensurePurchasesHydrated } from "@/lib/purchases-store";

export function PurchasesHydrator() {
  const account = useAccountIdentity();

  useEffect(() => {
    ensurePurchasesHydrated(account?.username ?? null);
  }, [account?.username]);

  return null;
}
