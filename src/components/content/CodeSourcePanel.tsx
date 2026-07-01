"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lock, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useEditor } from "@/hooks/useEditor";
import { useMarketplaceBuy } from "@/hooks/useMarketplaceBuy";
import { ParentalPurchaseConsent } from "@/components/marketplace/ParentalPurchaseConsent";
import { usePostSourceCode } from "@/hooks/usePostSourceCode";
import { requiresCodePurchase } from "@/lib/posts";
import { stripThemeMusic } from "@/lib/template-preview";
import {
  hasPurchased,
  PURCHASE_CONFIRMED_EVENT,
  type PurchaseConfirmedDetail,
  subscribePurchases,
} from "@/lib/purchases-store";
import { verifySourceAccess } from "@/lib/verify-marketplace-purchase";
import type { FeedPost } from "@/types/database";

type Tab = "html" | "css" | "js";

interface CodeSourcePanelProps {
  post: FeedPost;
  inviteToken?: string | null;
}

export function CodeSourcePanel({ post, inviteToken }: CodeSourcePanelProps) {
  const { isLoggedIn } = useAuth();
  const identity = useActingIdentity();
  /** Stripe records the buyer as whoever was active when checkout started (demo persona or account). */
  const buyerUsername = identity?.username ?? null;
  const { isEditor } = useEditor();
  const [tab, setTab] = useState<Tab>("html");
  const [unlocked, setUnlocked] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);
  const { buy, busy, error: buyError, isMinor, missingAge } = useMarketplaceBuy();
  const [parentalConsent, setParentalConsent] = useState(false);

  const needsPurchase = requiresCodePurchase(post);
  const isAuthor =
    buyerUsername?.toLowerCase() === post.author.username.toLowerCase();
  const viewer = useMemo(
    () => ({
      isLoggedIn,
      username: buyerUsername,
      inviteToken,
      isEditor,
    }),
    [isLoggedIn, buyerUsername, inviteToken, isEditor]
  );
  const { bundle, loading, error: sourceError } = usePostSourceCode(
    post.id,
    unlocked,
    buyerUsername,
    needsPurchase && !isAuthor
  );

  const refreshAccess = useCallback(async () => {
    if (buyerUsername && hasPurchased(buyerUsername, post.id)) {
      setUnlocked(true);
    }
    const next = await verifySourceAccess(post, viewer, buyerUsername);
    setUnlocked(next);
    if (!next) setJustPurchased(false);
  }, [post, viewer, buyerUsername]);

  useEffect(() => {
    if (buyerUsername && hasPurchased(buyerUsername, post.id)) {
      setUnlocked(true);
    }
    void refreshAccess();
    const unsub = subscribePurchases(() => {
      if (buyerUsername && hasPurchased(buyerUsername, post.id)) {
        setUnlocked(true);
      }
      void refreshAccess();
    });
    return unsub;
  }, [buyerUsername, post.id, refreshAccess]);

  useEffect(() => {
    function onPurchaseConfirmed(event: Event) {
      const detail = (event as CustomEvent<PurchaseConfirmedDetail>).detail;
      if (!detail || !buyerUsername) return;
      if (detail.postId !== post.id) return;
      if (detail.username.toLowerCase() !== buyerUsername.toLowerCase()) return;
      setUnlocked(true);
      setJustPurchased(true);
      void refreshAccess();
    }
    window.addEventListener(PURCHASE_CONFIRMED_EVENT, onPurchaseConfirmed);
    return () => window.removeEventListener(PURCHASE_CONFIRMED_EVENT, onPurchaseConfirmed);
  }, [post.id, buyerUsername, refreshAccess]);

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) void refreshAccess();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [refreshAccess]);

  async function handlePurchase() {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    const result = await buy(
      {
        post_id: post.id,
        title: post.title,
        price_cents: post.price_cents,
        seller_username: post.author.username,
      },
      parentalConsent
    );
    if (result === "unlocked") {
      setJustPurchased(true);
      void refreshAccess();
    }
    // "redirecting" — stay locked until Stripe confirms payment on return.
  }

  if (!unlocked) {
    return (
      <div className="comic-panel p-6 space-y-4 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center border-2 border-ink bg-comic-yellow">
          <Lock className="h-6 w-6 text-comic-red" />
        </div>
        <div>
          <h3 className="font-comic text-lg text-ink">Source code locked</h3>
          <p className="text-sm text-ink-muted mt-2 max-w-md mx-auto leading-relaxed">
            {needsPurchase ? (
              <>
                You can see the cover preview above, but HTML, CSS, and JavaScript stay hidden until
                you purchase this listing.
              </>
            ) : (
              <>Sign in to view and fork the source code for this free template.</>
            )}
          </p>
        </div>
        {needsPurchase ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!isLoggedIn ? (
              <Link
                href="/login"
                className="inline-flex items-center justify-center font-comic font-bold h-8 px-4 text-sm bg-comic-red text-white border-2 border-ink shadow-[3px_3px_0_#1a1a2e] hover:shadow-[1px_1px_0_#1a1a2e] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                Sign in to buy
              </Link>
            ) : (
              <div className="w-full max-w-md mx-auto space-y-3">
                {isMinor && (
                  <ParentalPurchaseConsent
                    checked={parentalConsent}
                    onChange={setParentalConsent}
                  />
                )}
                {missingAge && (
                  <p className="text-xs text-ink-muted">
                    Add your birth date in{" "}
                    <Link href="/settings?tab=account" className="text-comic-red hover:underline font-comic">
                      Settings → Account
                    </Link>{" "}
                    before purchasing.
                  </p>
                )}
                <Button
                  variant="comic"
                  disabled={busy || (isMinor && !parentalConsent)}
                  onClick={() => void handlePurchase()}
                >
                  <ShoppingBag className="h-4 w-4 mr-1.5" />
                  {busy ? "Opening checkout…" : `Buy for ${formatPrice(post.price_cents)}`}
                </Button>
              </div>
            )}
            {buyError && (
              <p className="text-xs text-comic-red w-full font-comic">{buyError}</p>
            )}
            <p className="text-xs text-ink-muted w-full">
              Payment goes to the creator via Stripe. Your platform fee supports Universes of RPG.
            </p>
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center justify-center font-comic font-bold h-8 px-4 text-sm bg-comic-red text-white border-2 border-ink shadow-[3px_3px_0_#1a1a2e] hover:shadow-[1px_1px_0_#1a1a2e] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            Sign in free
          </Link>
        )}
      </div>
    );
  }

  const sources: { id: Tab; label: string; code: string | null }[] = [
    {
      id: "html",
      label: "HTML",
      code: stripThemeMusic(
        needsPurchase ? (bundle?.html_code ?? "") : (bundle?.html_code ?? post.html_code ?? "")
      ) || null,
    },
    {
      id: "css",
      label: "CSS",
      code: needsPurchase ? (bundle?.css_code ?? null) : (bundle?.css_code ?? post.css_code),
    },
    {
      id: "js",
      label: "JS",
      code: needsPurchase ? (bundle?.js_code ?? null) : (bundle?.js_code ?? post.js_code),
    },
  ];

  const active = sources.find((s) => s.id === tab) ?? sources[0];

  return (
    <div className="comic-panel overflow-hidden">
      {!needsPurchase && (
        <p className="px-4 py-2 text-xs font-comic bg-emerald-100 border-b-2 border-ink text-ink">
          Free template — HTML, CSS, and JS are open for everyone.
        </p>
      )}
      {justPurchased && (
        <p className="px-4 py-2 text-xs font-comic bg-emerald-100 border-b-2 border-ink text-ink">
          Purchase confirmed — source code unlocked.
        </p>
      )}
      {loading && (
        <p className="px-4 py-2 text-xs font-comic text-ink-muted border-b-2 border-ink">
          Loading source…
        </p>
      )}
      {sourceError && !loading && (
        <p className="px-4 py-2 text-xs font-comic text-comic-red border-b-2 border-ink">
          {sourceError} Ask the creator to re-save the listing so code syncs to the server.
        </p>
      )}
      <div className="flex border-b-2 border-ink bg-comic-yellow/40">
        {sources.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setTab(s.id)}
            className={`px-4 py-2.5 text-sm font-mono uppercase border-r-2 border-ink last:border-r-0 ${
              tab === s.id ? "bg-comic-red text-white" : "text-ink hover:bg-comic-yellow"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <pre
        className={`p-4 font-mono text-xs overflow-auto bg-surface leading-relaxed whitespace-pre-wrap ${
          needsPurchase ? "max-h-80" : "max-h-[70vh]"
        }`}
      >
        {active.code?.trim() || `/* No ${active.label} for this template */`}
      </pre>
    </div>
  );
}
