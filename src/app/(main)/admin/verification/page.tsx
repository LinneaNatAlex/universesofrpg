"use client";

import { useEffect, useState } from "react";
import {
  getAllVerificationSubscriptions,
  subscribeVerificationPayments,
} from "@/lib/verification-payments-store";
import { formatPricePerMonth, VERIFICATION_SUBSCRIPTION_CENTS } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { isVerifiedCreator } from "@/lib/verified-creators-store";
import type { VerificationSubscription } from "@/lib/verification-payments-store";

export default function AdminVerificationPage() {
  const [subscriptions, setSubscriptions] = useState<VerificationSubscription[]>([]);

  useEffect(() => {
    const refresh = () => setSubscriptions(getAllVerificationSubscriptions());
    refresh();
    return subscribeVerificationPayments(refresh);
  }, []);

  const active = subscriptions.filter((s) => s.status === "active");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-comic text-xl text-ink">
          Verified creator subscriptions ({active.length} active)
        </h2>
        <p className="text-sm text-ink-muted mt-1">
          Creators subscribe via Stripe ({formatPricePerMonth(VERIFICATION_SUBSCRIPTION_CENTS)})
          after meeting eligibility stats. Badge unlocks automatically — no manual review.
        </p>
      </div>

      {subscriptions.length === 0 && (
        <p className="text-sm text-ink-muted italic">No subscriptions recorded in this browser yet.</p>
      )}

      {subscriptions.map((sub) => {
        const badge = isVerifiedCreator(sub.username);
        return (
          <div key={`${sub.username}-${sub.started_at}`} className="comic-panel p-4 space-y-2">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-comic text-ink">@{sub.username}</p>
              <div className="flex gap-2">
                <Badge variant={sub.status === "active" ? "free" : "paid"}>{sub.status}</Badge>
                {badge && <Badge variant="comic">verified badge</Badge>}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-comic text-ink-muted">
              <span>Started {new Date(sub.started_at).toLocaleDateString()}</span>
              <span>Period ends {new Date(sub.current_period_end).toLocaleDateString()}</span>
              {sub.stripe_subscription_id && (
                <span className="truncate max-w-xs">Stripe {sub.stripe_subscription_id}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
