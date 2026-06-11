"use client";

import { useEffect, useState } from "react";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useAuth } from "@/hooks/useAuth";
import {
  clearPendingVerificationCheckout,
  readPendingVerificationCheckout,
} from "@/lib/verification-checkout-pending";
import { activateVerifiedCreatorSubscription } from "@/lib/verification-payments-store";

const PROCESSED_SESSION_KEY = "uorpg_verification_processed_session";

export interface VerificationCheckoutReturnState {
  confirming: boolean;
  error: string | null;
  successMessage: string | null;
  dismiss: () => void;
}

export function useVerificationCheckoutReturn(): VerificationCheckoutReturnState {
  const { user } = useAuth();
  const identity = useActingIdentity();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!identity?.username) return;

    const params = new URLSearchParams(window.location.search);
    const verification = params.get("verification");
    const sessionId = params.get("session_id")?.trim();

    function cleanUrl() {
      params.delete("verification");
      params.delete("session_id");
      params.delete("tab");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname
      );
    }

    if (verification === "canceled") {
      setError("Checkout was canceled. You were not charged.");
      cleanUrl();
      return;
    }

    if (verification !== "success" || !sessionId) return;

    if (sessionStorage.getItem(PROCESSED_SESSION_KEY) === sessionId) {
      cleanUrl();
      return;
    }

    let cancelled = false;

    async function confirmCheckout() {
      setConfirming(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/stripe/verification-session?session_id=${encodeURIComponent(sessionId!)}`
        );
        const data = (await res.json()) as {
          error?: string;
          username?: string | null;
          customer_email?: string | null;
          status?: "active" | "canceled" | "past_due";
          current_period_end?: string;
          stripe_subscription_id?: string;
          stripe_customer_id?: string | null;
          amount_cents?: number;
        };

        if (!res.ok) {
          throw new Error(data.error ?? "Could not confirm payment");
        }

        const pending = readPendingVerificationCheckout();
        const resolvedUsername = (
          data.username ??
          pending?.username ??
          identity!.username
        ).toLowerCase();

        if (resolvedUsername !== identity!.username.toLowerCase()) {
          throw new Error("This checkout belongs to a different account.");
        }

        if (data.customer_email && user?.email) {
          const paidEmail = data.customer_email.toLowerCase();
          const accountEmail = user.email.toLowerCase();
          const pendingEmail = pending?.email?.toLowerCase();
          if (paidEmail !== accountEmail && paidEmail !== pendingEmail) {
            throw new Error("Payment email does not match your signed-in account.");
          }
        }

        if (!cancelled && data.status && data.current_period_end) {
          activateVerifiedCreatorSubscription({
            username: resolvedUsername,
            amount_cents: data.amount_cents,
            status: data.status,
            current_period_end: data.current_period_end,
            stripe_subscription_id: data.stripe_subscription_id ?? null,
            stripe_customer_id: data.stripe_customer_id ?? null,
          });
          sessionStorage.setItem(PROCESSED_SESSION_KEY, sessionId!);
          clearPendingVerificationCheckout();
          setSuccessMessage("Subscription active — verified creator badge unlocked!");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not confirm payment.");
        }
      } finally {
        if (!cancelled) setConfirming(false);
        cleanUrl();
      }
    }

    confirmCheckout();
    return () => {
      cancelled = true;
    };
  }, [identity?.username, user?.email]);

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
