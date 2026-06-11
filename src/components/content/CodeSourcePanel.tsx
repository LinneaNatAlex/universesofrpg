"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useEditor } from "@/hooks/useEditor";
import { useMarketplaceBuy } from "@/hooks/useMarketplaceBuy";
import { usePostSourceCode } from "@/hooks/usePostSourceCode";
import { authFetchHeaders } from "@/lib/api-client-auth";
import {
  canViewCodeSource,
  requiresCodePurchase,
} from "@/lib/posts";
import { recordPurchase, subscribePurchases } from "@/lib/purchases-store";
import type { FeedPost } from "@/types/database";

type Tab = "html" | "css" | "js";

interface CodeSourcePanelProps {
  post: FeedPost;
  inviteToken?: string | null;
}

export function CodeSourcePanel({ post, inviteToken }: CodeSourcePanelProps) {
  const { isLoggedIn } = useAuth();
  const identity = useActingIdentity();
  const buyerUsername = identity?.username ?? null;
  const { isEditor } = useEditor();
  const [tab, setTab] = useState<Tab>("html");
  const [unlocked, setUnlocked] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);
  const { buy, busy, error: buyError } = useMarketplaceBuy();

  const needsPurchase = requiresCodePurchase(post);
  const viewer = { isLoggedIn, username: buyerUsername, inviteToken, isEditor };
  const { bundle, loading, error: sourceError } = usePostSourceCode(
    post.id,
    unlocked,
    buyerUsername
  );

  useEffect(() => {
    const refresh = async () => {
      let next = canViewCodeSource(post, viewer);

      if (!next && buyerUsername && needsPurchase) {
        try {
          const headers = await authFetchHeaders();
          const purchaseUrl = new URL("/api/marketplace/purchases", window.location.origin);
          purchaseUrl.searchParams.set("post_id", post.id);
          purchaseUrl.searchParams.set("acting_username", buyerUsername);
          const res = await fetch(purchaseUrl.toString(), {
            credentials: "include",
            headers,
            cache: "no-store",
          });
          if (res.ok) {
            const data = (await res.json()) as { purchased?: boolean };
            if (data.purchased) {
              recordPurchase(buyerUsername, post.id);
              next = true;
            }
          }
        } catch {
          // keep local cache
        }
      }

      setUnlocked(next);
    };

    void refresh();
    const unsub = subscribePurchases(() => {
      void refresh();
    });
    return unsub;
  }, [post, isLoggedIn, buyerUsername, inviteToken, isEditor, needsPurchase]);

  async function handlePurchase() {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    const ok = await buy(
      {
        post_id: post.id,
        title: post.title,
        price_cents: post.price_cents,
        seller_username: post.author.username,
      },
      () => {
        setJustPurchased(true);
        setUnlocked(true);
      }
    );
    if (ok) {
      setJustPurchased(true);
      setUnlocked(true);
    }
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
              <Button variant="comic" disabled={busy} onClick={() => void handlePurchase()}>
                <ShoppingBag className="h-4 w-4 mr-1.5" />
                {busy ? "Opening checkout…" : `Buy for ${formatPrice(post.price_cents)}`}
              </Button>
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
    { id: "html", label: "HTML", code: bundle?.html_code ?? post.html_code },
    { id: "css", label: "CSS", code: bundle?.css_code ?? post.css_code },
    { id: "js", label: "JS", code: bundle?.js_code ?? post.js_code },
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
          Loading source from server…
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
