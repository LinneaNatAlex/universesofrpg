"use client";

import { useEffect, useState } from "react";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useAuth } from "@/hooks/useAuth";
import { useVerifiedCreator } from "@/hooks/useVerifiedCreator";
import {
  formatPricePerMonth,
  VERIFICATION_SUBSCRIPTION_CENTS,
} from "@/lib/currency";
import {
  getCreatorMetrics,
  getVerificationEligibilityGaps,
  meetsVerificationThresholds,
  VERIFICATION_THRESHOLDS,
} from "@/lib/creator-metrics";
import { subscribeCreatorFollows } from "@/lib/creator-follows-store";
import { subscribePosts } from "@/lib/posts-store";
import {
  activateVerifiedCreatorSubscription,
  getVerificationSubscription,
  hasActiveVerificationSubscription,
  subscribeVerificationPayments,
  syncVerifiedCreatorAccess,
} from "@/lib/verification-payments-store";
import {
  clearPendingVerificationCheckout,
  readPendingVerificationCheckout,
  savePendingVerificationCheckout,
} from "@/lib/verification-checkout-pending";
import { getVerificationPaymentLink } from "@/lib/stripe-verification-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CreditCard, Shield, XCircle } from "lucide-react";

export function VerifiedCreatorSubscribe() {
  const { user } = useAuth();
  const identity = useActingIdentity();
  const isVerified = useVerifiedCreator(identity?.username ?? null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [metrics, setMetrics] = useState(() =>
    identity ? getCreatorMetrics(identity.username) : null
  );

  useEffect(() => {
    if (!identity?.username) return;

    const refresh = () => {
      setMetrics(getCreatorMetrics(identity.username));
      syncVerifiedCreatorAccess(identity.username);
      const active = hasActiveVerificationSubscription(identity.username);
      setSubscribed(active);
      const sub = getVerificationSubscription(identity.username);
      setPeriodEnd(sub?.current_period_end ?? null);
    };

    refresh();
    const unsubPosts = subscribePosts(refresh);
    const unsubFollows = subscribeCreatorFollows(refresh);
    const unsubPay = subscribeVerificationPayments(refresh);
    return () => {
      unsubPosts();
      unsubFollows();
      unsubPay();
    };
  }, [identity?.username]);

  useEffect(() => {
    if (!identity?.username) return;

    const params = new URLSearchParams(window.location.search);
    const verification = params.get("verification");
    const sessionId = params.get("session_id");

    if (verification === "canceled") {
      setError("Checkout was canceled. You were not charged.");
      params.delete("verification");
      params.delete("session_id");
      const next = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", next.endsWith("?") ? next.slice(0, -1) : next);
      return;
    }

    if (verification !== "success" || !sessionId) return;

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
          setSubscribed(data.status === "active");
          setPeriodEnd(data.current_period_end);
          setSuccessMessage("Subscription active — verified creator badge unlocked!");
          clearPendingVerificationCheckout();
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not confirm payment.");
        }
      } finally {
        if (!cancelled) setConfirming(false);
        params.delete("verification");
        params.delete("session_id");
        const qs = params.toString();
        window.history.replaceState(
          {},
          "",
          qs ? `${window.location.pathname}?${qs}` : window.location.pathname
        );
      }
    }

    confirmCheckout();
    return () => {
      cancelled = true;
    };
  }, [identity?.username]);

  if (!identity || !user) return null;

  if (isVerified === true) {
    return (
      <div className="comic-panel p-5 flex items-center gap-3">
        <Shield className="h-8 w-8 text-comic-red shrink-0" />
        <div>
          <p className="font-comic text-ink">Verified creator</p>
          <p className="text-sm text-ink-muted">
            Your profile shows the verified badge. Keep your subscription active to stay
            verified.
          </p>
          {periodEnd && (
            <p className="text-xs text-ink-muted mt-1">
              Current period ends {new Date(periodEnd).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  const eligible = metrics ? meetsVerificationThresholds(metrics) : false;
  const gaps = metrics ? getVerificationEligibilityGaps(metrics) : [];
  const priceLabel = formatPricePerMonth(VERIFICATION_SUBSCRIPTION_CENTS);

  async function handleSubscribe() {
    setError(null);
    setSuccessMessage(null);

    if (!eligible) {
      setError("You need to meet the follower and likes requirements before subscribing.");
      return;
    }

    setCheckingOut(true);
    try {
      const paymentLink = getVerificationPaymentLink();
      savePendingVerificationCheckout(identity!.username, user?.email ?? undefined);
      const url = new URL(paymentLink);
      if (user?.email) {
        url.searchParams.set("prefilled_email", user.email);
      }
      window.location.href = url.toString();
    } catch {
      setError("Could not open Stripe checkout. Try again.");
      setCheckingOut(false);
    }
  }

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="comic-panel p-4 flex items-start gap-2 border-2 border-comic-red/30 bg-comic-yellow/20">
          <CheckCircle2 className="h-5 w-5 text-comic-red shrink-0 mt-0.5" />
          <p className="text-sm text-ink">{successMessage}</p>
        </div>
      )}

      <div className="comic-panel p-4 space-y-2 border-2 border-comic-red/30 bg-comic-yellow/20">
        <p className="font-comic text-ink">Verified creator — {priceLabel}</p>
        <p className="text-xs text-ink-muted">
          Subscribe through Stripe to unlock the verified badge instantly. No application
          review — you must meet the minimum stats below first.
        </p>
        {subscribed && !isVerified ? (
          <Badge variant="paid">Subscription inactive — renew to keep your badge</Badge>
        ) : null}
        {confirming ? (
          <p className="text-sm font-comic text-ink-muted">Confirming your payment…</p>
        ) : (
          <Button
            type="button"
            variant="comic"
            size="sm"
            onClick={handleSubscribe}
            disabled={checkingOut || !eligible || confirming}
          >
            <CreditCard className="h-4 w-4 mr-1.5" />
            {checkingOut ? "Redirecting…" : `Subscribe ${priceLabel}`}
          </Button>
        )}
        <p className="text-[10px] text-ink-muted">
          You&apos;ll return here after Stripe checkout. Set the Payment Link redirect in
          Stripe to this site&apos;s settings URL with{" "}
          <code className="text-[9px]">session_id=&#123;CHECKOUT_SESSION_ID&#125;</code>.
        </p>
      </div>

      <div className="comic-panel p-4 space-y-3">
        <h3 className="font-comic text-ink">Eligibility</h3>
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="border-2 border-ink p-2">
              <p className="font-comic text-xl text-comic-red">{metrics.follower_count}</p>
              <p className="text-[10px] text-ink-muted uppercase">Followers</p>
            </div>
            <div className="border-2 border-ink p-2">
              <p className="font-comic text-xl text-comic-red">{metrics.max_likes_on_post}</p>
              <p className="text-[10px] text-ink-muted uppercase">Best post likes</p>
            </div>
            <div className="border-2 border-ink p-2">
              <p className="font-comic text-xl text-comic-red">{metrics.posts_count}</p>
              <p className="text-[10px] text-ink-muted uppercase">Posts</p>
            </div>
            <div className="border-2 border-ink p-2">
              <p className="font-comic text-xl text-comic-red">{metrics.total_likes}</p>
              <p className="text-[10px] text-ink-muted uppercase">Total likes</p>
            </div>
          </div>
        )}
        <p className="text-xs text-ink-muted">
          Requirements: {VERIFICATION_THRESHOLDS.min_followers}+ followers, at least one
          approved post with {VERIFICATION_THRESHOLDS.min_likes_per_post}+ likes. Thresholds
          may increase later.
        </p>
        {eligible ? (
          <Badge variant="free" className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Eligible to subscribe
          </Badge>
        ) : (
          <div className="space-y-2">
            <Badge variant="paid" className="inline-flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Not eligible yet
            </Badge>
            {gaps.length > 0 && (
              <ul className="text-xs text-ink-muted space-y-1 list-disc pl-4">
                {gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-comic-red bg-comic-red/10 border border-comic-red px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
