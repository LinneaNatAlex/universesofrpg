"use client";

import { useEffect, useState } from "react";
import {
  hasActiveVerificationSubscription,
  subscribeVerificationPayments,
} from "@/lib/verification-payments-store";
import {
  isSeededVerifiedCreator,
  isVerifiedCreator,
  subscribeVerifiedCreators,
} from "@/lib/verified-creators-store";

function resolveVerified(username: string): boolean {
  if (isSeededVerifiedCreator(username)) return true;
  return (
    isVerifiedCreator(username) && hasActiveVerificationSubscription(username)
  );
}

/** `null` while resolving — avoids flashing UI that depends on verified status. */
export function useVerifiedCreator(username: string | null): boolean | null {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!username) {
      setVerified(false);
      return;
    }
    const refresh = () => setVerified(resolveVerified(username));
    refresh();
    const unsubVerified = subscribeVerifiedCreators(refresh);
    const unsubPayments = subscribeVerificationPayments(refresh);
    return () => {
      unsubVerified();
      unsubPayments();
    };
  }, [username]);

  return verified;
}
