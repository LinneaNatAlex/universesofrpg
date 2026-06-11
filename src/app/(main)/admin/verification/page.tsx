"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getAllVerificationSubscriptions,
  hasActiveVerificationSubscription,
  subscribeVerificationPayments,
} from "@/lib/verification-payments-store";
import { formatPricePerMonth, VERIFICATION_SUBSCRIPTION_CENTS } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAllAdminRevokedVerifiedCreators,
  getAllVerifiedCreators,
  isAdminRevokedVerifiedCreator,
  isSeededVerifiedCreator,
  isVerifiedCreator,
  subscribeVerifiedCreators,
} from "@/lib/verified-creators-store";
import { adminRevokeVerifiedAccess } from "@/lib/admin-verification-actions";
import { DEMO_PERSONAS } from "@/lib/personas";
import { useVerifiedCreator } from "@/hooks/useVerifiedCreator";
import type { VerificationSubscription } from "@/lib/verification-payments-store";
import type { PlatformVerificationSubscription } from "@/lib/verification-platform-store";
import { Shield, ShieldOff } from "lucide-react";

function canRemoveVerifiedAccess(
  row: VerifiedRow,
  showsVerified: boolean | null
): boolean {
  return (
    showsVerified === true ||
    row.subscription !== null ||
    (row.seeded && !row.adminRevoked) ||
    (!row.adminRevoked && isVerifiedCreator(row.username))
  );
}

interface VerifiedRow {
  username: string;
  displayName: string;
  seeded: boolean;
  adminRevoked: boolean;
  subscription: VerificationSubscription | null;
  subscriptionActive: boolean;
  showsBadge: boolean;
}

function VerifiedRowCard({
  row,
  onChange,
  onNotice,
}: {
  row: VerifiedRow;
  onChange: () => void;
  onNotice: (message: string | null) => void;
}) {
  const showsVerified = useVerifiedCreator(row.username);

  return (
    <div className="comic-panel p-4 space-y-3">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <Link
            href={`/profile/${row.username}`}
            className="font-comic text-ink hover:text-comic-red hover:underline"
          >
            {row.displayName}
          </Link>
          <p className="text-xs text-ink-muted">@{row.username}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {row.seeded && <Badge variant="tag">demo persona</Badge>}
          {row.adminRevoked && <Badge variant="paid">admin revoked</Badge>}
          {row.subscription && (
            <Badge variant={row.subscriptionActive ? "free" : "paid"}>
              sub {row.subscription.status}
            </Badge>
          )}
          {showsVerified === true && <Badge variant="comic">verified badge</Badge>}
          {showsVerified === false && !row.adminRevoked && row.seeded && (
            <Badge variant="paid">badge hidden</Badge>
          )}
        </div>
      </div>

      {row.subscription && (
        <div className="flex flex-wrap gap-4 text-xs font-comic text-ink-muted">
          <span>Started {new Date(row.subscription.started_at).toLocaleDateString()}</span>
          <span>
            Period ends {new Date(row.subscription.current_period_end).toLocaleDateString()}
          </span>
          {row.subscription.stripe_subscription_id && (
            <span className="truncate max-w-xs">
              Stripe {row.subscription.stripe_subscription_id}
            </span>
          )}
        </div>
      )}

      {canRemoveVerifiedAccess(row, showsVerified) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (
              !window.confirm(
                `Remove verified access for @${row.username}? This hides the badge for everyone on the site and deletes subscription data. Cancel billing separately in Stripe if needed.`
              )
            ) {
              return;
            }
            void adminRevokeVerifiedAccess(row.username).then((result) => {
              onNotice(result.error ?? null);
              if (result.ok) onChange();
            });
          }}
        >
          <ShieldOff className="h-3.5 w-3.5 mr-1" />
          Remove verified access
        </Button>
      )}
    </div>
  );
}

export default function AdminVerificationPage() {
  const [subscriptions, setSubscriptions] = useState<VerificationSubscription[]>([]);
  const [revoked, setRevoked] = useState<string[]>([]);
  const [granted, setGranted] = useState<string[]>([]);
  const [revokeInput, setRevokeInput] = useState("");
  const [tick, setTick] = useState(0);
  const [platformRevoked, setPlatformRevoked] = useState<string[]>([]);
  const [platformSubscriptions, setPlatformSubscriptions] = useState<
    PlatformVerificationSubscription[]
  >([]);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadPlatform() {
    try {
      const res = await fetch("/api/admin/verification/platform", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        revoked?: string[];
        subscriptions?: PlatformVerificationSubscription[];
      };
      setPlatformRevoked(data.revoked ?? []);
      setPlatformSubscriptions(data.subscriptions ?? []);
    } catch {
      /* local-only fallback */
    }
  }

  function refresh() {
    setSubscriptions(getAllVerificationSubscriptions());
    setRevoked(getAllAdminRevokedVerifiedCreators());
    setGranted(getAllVerifiedCreators());
    setTick((n) => n + 1);
    void loadPlatform();
  }

  useEffect(() => {
    refresh();
    const unsubPay = subscribeVerificationPayments(refresh);
    const unsubVerified = subscribeVerifiedCreators(refresh);
    return () => {
      unsubPay();
      unsubVerified();
    };
  }, []);

  const rows = useMemo((): VerifiedRow[] => {
    const byUser = new Map<string, VerifiedRow>();

    for (const persona of DEMO_PERSONAS.filter((p) => p.is_verified_creator)) {
      byUser.set(persona.username.toLowerCase(), {
        username: persona.username.toLowerCase(),
        displayName: persona.display_name,
        seeded: true,
        adminRevoked: isAdminRevokedVerifiedCreator(persona.username),
        subscription: null,
        subscriptionActive: false,
        showsBadge: isVerifiedCreator(persona.username),
      });
    }

    for (const username of granted) {
      const key = username.toLowerCase();
      if (byUser.has(key)) continue;
      byUser.set(key, {
        username: key,
        displayName: key,
        seeded: isSeededVerifiedCreator(key),
        adminRevoked: isAdminRevokedVerifiedCreator(key),
        subscription: null,
        subscriptionActive: false,
        showsBadge: isVerifiedCreator(key),
      });
    }

    for (const username of platformRevoked) {
      const key = username.toLowerCase();
      const existing = byUser.get(key);
      if (existing) {
        existing.adminRevoked = true;
        existing.showsBadge = false;
      } else {
        byUser.set(key, {
          username: key,
          displayName: key,
          seeded: isSeededVerifiedCreator(key),
          adminRevoked: true,
          subscription: null,
          subscriptionActive: false,
          showsBadge: false,
        });
      }
    }

    for (const psub of platformSubscriptions) {
      const key = psub.username.toLowerCase();
      const active =
        psub.status === "active" &&
        !!psub.current_period_end &&
        new Date(psub.current_period_end).getTime() > Date.now();
      const localSub: VerificationSubscription = {
        username: key,
        amount_cents: psub.amount_cents ?? 900,
        status: psub.status,
        current_period_end: psub.current_period_end ?? new Date().toISOString(),
        stripe_subscription_id: psub.stripe_subscription_id,
        stripe_customer_id: psub.stripe_customer_id,
        started_at: psub.started_at,
      };
      const existing = byUser.get(key);
      if (existing) {
        existing.subscription = localSub;
        existing.subscriptionActive = active;
        existing.adminRevoked = platformRevoked.includes(key);
        existing.showsBadge = !existing.adminRevoked && (existing.seeded || active);
      } else {
        byUser.set(key, {
          username: key,
          displayName: key,
          seeded: isSeededVerifiedCreator(key),
          adminRevoked: platformRevoked.includes(key),
          subscription: localSub,
          subscriptionActive: active,
          showsBadge: !platformRevoked.includes(key) && active,
        });
      }
    }

    for (const sub of subscriptions) {
      const key = sub.username.toLowerCase();
      const existing = byUser.get(key);
      const active = hasActiveVerificationSubscription(key);
      if (existing) {
        existing.subscription = sub;
        existing.subscriptionActive = active;
        existing.showsBadge = isVerifiedCreator(key) && (existing.seeded || active);
      } else {
        byUser.set(key, {
          username: key,
          displayName: key,
          seeded: isSeededVerifiedCreator(key),
          adminRevoked: isAdminRevokedVerifiedCreator(key),
          subscription: sub,
          subscriptionActive: active,
          showsBadge: isVerifiedCreator(key) && active,
        });
      }
    }

    for (const username of revoked) {
      const key = username.toLowerCase();
      if (!byUser.has(key)) {
        byUser.set(key, {
          username: key,
          displayName: key,
          seeded: isSeededVerifiedCreator(key),
          adminRevoked: true,
          subscription: null,
          subscriptionActive: false,
          showsBadge: false,
        });
      }
    }

    return [...byUser.values()].sort((a, b) => a.username.localeCompare(b.username));
  }, [subscriptions, granted, revoked, platformRevoked, platformSubscriptions, tick]);

  const activeCount = subscriptions.filter((s) => s.status === "active").length;

  async function handleRevokeByUsername(e: React.FormEvent) {
    e.preventDefault();
    const username = revokeInput.trim().toLowerCase().replace(/^@/, "");
    if (!username) return;
    if (
      !window.confirm(
        `Remove verified access for @${username}? This hides the badge for everyone on the site.`
      )
    ) {
      return;
    }
    const result = await adminRevokeVerifiedAccess(username);
    setNotice(result.error ?? null);
    if (result.ok) {
      setRevokeInput("");
      refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-comic text-xl text-ink flex items-center gap-2">
          <Shield className="h-5 w-5 text-comic-red" />
          Verified creators ({activeCount} active subscriptions)
        </h2>
        <p className="text-sm text-ink-muted mt-1">
          Remove verified access hides the badge for <strong>all visitors</strong> (saved on the
          server). To stop Stripe billing, cancel the subscription in{" "}
          <a
            href="https://dashboard.stripe.com/subscriptions"
            className="text-comic-red hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Stripe Dashboard
          </a>
          .
        </p>
      </div>

      {notice && (
        <p className="text-sm text-comic-red bg-comic-red/10 border border-comic-red px-3 py-2">
          {notice}
        </p>
      )}

      <form onSubmit={handleRevokeByUsername} className="comic-panel p-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[12rem]">
          <label className="font-comic text-sm text-ink block mb-1">
            Remove verified access for username
          </label>
          <input
            value={revokeInput}
            onChange={(e) => setRevokeInput(e.target.value)}
            placeholder="roninforge"
            className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
          />
        </div>
        <Button type="submit" variant="ghost" size="sm" disabled={!revokeInput.trim()}>
          <ShieldOff className="h-3.5 w-3.5 mr-1" />
          Remove access
        </Button>
      </form>

      {rows.length === 0 && (
        <p className="text-sm text-ink-muted italic">
          No verified creators or subscriptions in this browser yet.
        </p>
      )}

      <div className="space-y-3">
        {rows.map((row) => (
          <VerifiedRowCard
            key={row.username}
            row={row}
            onChange={refresh}
            onNotice={setNotice}
          />
        ))}
      </div>

      <p className="text-xs text-ink-muted">
        Subscriptions: {formatPricePerMonth(VERIFICATION_SUBSCRIPTION_CENTS)} via Stripe Payment
        Link. Badge unlocks after successful checkout redirect.
      </p>
    </div>
  );
}
