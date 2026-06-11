"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";

interface ConnectStatus {
  configured: boolean;
  connected?: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  platform_commission_percent: number;
}

export function CreatorPayoutSettings() {
  const { isLoggedIn } = useAuth();
  const identity = useActingIdentity();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sellerUsername = identity?.username ?? null;
  const actingAsDemo = Boolean(identity?.isActingAsPersona);

  const refresh = useCallback(async () => {
    if (!sellerUsername) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/stripe/connect/status", window.location.origin);
      if (actingAsDemo) {
        url.searchParams.set("acting_username", sellerUsername);
      }
      const res = await fetch(url.toString(), {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not load payout status.");
      }
      setStatus((await res.json()) as ConnectStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load payout status.");
    } finally {
      setLoading(false);
    }
  }, [sellerUsername, actingAsDemo]);

  useEffect(() => {
    if (!isLoggedIn) return;
    void refresh();
  }, [isLoggedIn, refresh]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connect = params.get("connect");
    if (connect === "success" || connect === "refresh") {
      void refresh();
      params.delete("connect");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname
      );
    }
  }, [refresh]);

  async function handleOnboard() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          acting_username: actingAsDemo ? sellerUsername : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not start Stripe onboarding.");
      }
      if (!data.url) {
        throw new Error("Stripe onboarding URL missing.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onboarding failed.");
      setBusy(false);
    }
  }

  if (!isLoggedIn || !identity) return null;

  const commission = status?.platform_commission_percent ?? 10;
  const ready = Boolean(status?.charges_enabled);

  return (
    <div className="comic-panel p-5 space-y-4 border-t-4 border-dashed border-ink">
      <div className="flex items-center gap-2">
        <Banknote className="h-5 w-5 text-comic-red" />
        <h2 className="font-comic text-xl text-ink">Shop payouts</h2>
      </div>

      <p className="text-sm text-ink-muted leading-relaxed">
        Connect Stripe to sell paid listings on the Shop for{" "}
        <strong>@{sellerUsername}</strong>. Buyers pay through Stripe Checkout; you receive
        payouts to your bank. Universes of RPG keeps a <strong>{commission}%</strong> platform
        fee on each sale.
      </p>

      {actingAsDemo && (
        <p className="text-xs font-comic bg-comic-blue/15 border-2 border-ink px-3 py-2 text-ink">
          Admin demo mode — Stripe onboarding is saved for @{sellerUsername}, not your admin
          account. Pick the seller in the blue bar above before clicking Set up payouts.
        </p>
      )}

      {loading && (
        <p className="text-sm font-comic text-ink-muted flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading payout status…
        </p>
      )}

      {!loading && status && !status.configured && (
        <p className="text-sm text-comic-red font-comic">
          Stripe is not configured on the server. Add STRIPE_SECRET_KEY to enable payouts.
        </p>
      )}

      {!loading && status?.configured && (
        <dl className="text-sm space-y-2">
          <div>
            <dt className="text-ink-muted font-comic text-xs uppercase">Status</dt>
            <dd className="font-comic">
              {ready
                ? "Ready to accept payments"
                : status.connected
                  ? "Finish Stripe setup to sell paid items"
                  : "Not connected"}
            </dd>
          </div>
          {status.connected && (
            <>
              <div>
                <dt className="text-ink-muted font-comic text-xs uppercase">Charges</dt>
                <dd>{status.charges_enabled ? "Enabled" : "Pending"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted font-comic text-xs uppercase">Payouts</dt>
                <dd>{status.payouts_enabled ? "Enabled" : "Pending"}</dd>
              </div>
            </>
          )}
        </dl>
      )}

      {error && (
        <div className="text-sm text-comic-red font-comic space-y-2">
          <p>{error}</p>
          {error.includes("platform-profile") && (
            <p className="text-xs text-ink-normal font-sans leading-relaxed">
              In Stripe Dashboard (live mode): open{" "}
              <strong>Settings → Connect → Platform profile</strong> and complete the
              questionnaire about loss liability — then try again.
            </p>
          )}
          {error.toUpperCase().includes("HTTPS") && (
            <p className="text-xs text-ink-normal font-sans leading-relaxed">
              <strong>localhost + live keys does not work.</strong> Either switch{" "}
              <code className="text-[11px]">.env.local</code> to{" "}
              <code className="text-[11px]">sk_test_</code> /{" "}
              <code className="text-[11px]">pk_test_</code> for local testing, or open
              Settings on your <strong>Netlify URL</strong> (https://…) with live keys.
            </p>
          )}
        </div>
      )}

      {status?.configured && (
        <Button
          type="button"
          variant="comic"
          size="sm"
          disabled={busy}
          onClick={() => void handleOnboard()}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Opening Stripe…
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-1.5" />
              {ready ? "Manage payouts in Stripe" : "Set up payouts with Stripe"}
            </>
          )}
        </Button>
      )}

      <p className="text-xs text-ink-muted">
        Stripe collects identity and bank details securely — nothing is stored on Universes of
        RPG. Paid Shop listings stay hidden from buyers until your account can accept charges.
      </p>
    </div>
  );
}
