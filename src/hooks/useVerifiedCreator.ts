"use client";

import { useCallback, useEffect, useState } from "react";
import {
  hasActiveVerificationSubscription,
  subscribeVerificationPayments,
} from "@/lib/verification-payments-store";
import {
  isAdminRevokedVerifiedCreator,
  isSeededVerifiedCreator,
  isVerifiedCreator,
  subscribeVerifiedCreators,
} from "@/lib/verified-creators-store";
import { VERIFICATION_UPDATED_EVENT } from "@/lib/admin-verification-actions";

function resolveLocalVerified(username: string): boolean {
  if (isAdminRevokedVerifiedCreator(username)) return false;
  if (isSeededVerifiedCreator(username)) return true;
  return (
    isVerifiedCreator(username) && hasActiveVerificationSubscription(username)
  );
}

async function fetchGlobalVerified(username: string): Promise<boolean | null> {
  try {
    const res = await fetch(
      `/api/verification/status?username=${encodeURIComponent(username)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { showsVerified?: boolean };
    return data.showsVerified === true;
  } catch {
    return null;
  }
}

/** `null` while resolving — avoids flashing UI that depends on verified status. */
export function useVerifiedCreator(username: string | null): boolean | null {
  const [verified, setVerified] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    if (!username) {
      setVerified(false);
      return;
    }

    const global = await fetchGlobalVerified(username);
    if (global !== null) {
      setVerified(global);
      return;
    }

    setVerified(resolveLocalVerified(username));
  }, [username]);

  useEffect(() => {
    refresh();
    const unsubVerified = subscribeVerifiedCreators(refresh);
    const unsubPayments = subscribeVerificationPayments(refresh);
    const onUpdated = () => refresh();
    window.addEventListener(VERIFICATION_UPDATED_EVENT, onUpdated);
    return () => {
      unsubVerified();
      unsubPayments();
      window.removeEventListener(VERIFICATION_UPDATED_EVENT, onUpdated);
    };
  }, [refresh]);

  return verified;
}
