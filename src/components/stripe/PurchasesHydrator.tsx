"use client";

import { useEffect } from "react";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { ensurePurchasesHydrated } from "@/lib/purchases-store";

export function PurchasesHydrator() {
  const identity = useActingIdentity();

  useEffect(() => {
    ensurePurchasesHydrated(identity?.username ?? null);
  }, [identity?.username]);

  return null;
}
