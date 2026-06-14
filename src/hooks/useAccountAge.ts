"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  ADULT_PURCHASE_AGE,
  isMinorForPurchases,
  MIN_ACCOUNT_AGE,
  parseUserAge,
} from "@/lib/account-age";

export function useAccountAge() {
  const { user, loading } = useAuth();

  return useMemo(() => {
    const age = parseUserAge(user?.user_metadata);
    return {
      loading,
      age,
      isMinor: isMinorForPurchases(age),
      isAdult: age != null && age >= ADULT_PURCHASE_AGE,
      missingAge: user != null && age == null,
      minAge: MIN_ACCOUNT_AGE,
      adultAge: ADULT_PURCHASE_AGE,
    };
  }, [user, loading]);
}
