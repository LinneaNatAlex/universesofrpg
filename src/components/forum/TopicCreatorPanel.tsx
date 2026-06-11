"use client";

import { useState } from "react";
import Link from "next/link";
import {
  lockForum,
  publishForumToShop,
  setForumPrivate,
  unlockForum,
} from "@/lib/forums-store";
import { formatPrice } from "@/lib/utils";
import type { RpgForum } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, LockOpen, ShoppingBag } from "lucide-react";

interface TopicCreatorPanelProps {
  forum: RpgForum;
  creatorUsername: string;
}

export function TopicCreatorPanel({ forum, creatorUsername }: TopicCreatorPanelProps) {
  const [shopPrice, setShopPrice] = useState(
    forum.shop_price_cents ? String(forum.shop_price_cents / 100) : "4.99"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handlePrivateToggle() {
    setError(null);
    setMessage(null);
    const nextPrivate = !forum.is_private;
    if (setForumPrivate(forum.id, creatorUsername, nextPrivate)) {
      setMessage(
        nextPrivate
          ? "Topic is now private (members only)."
          : "Topic is now public."
      );
    }
  }

  function handleLock() {
    setError(null);
    setMessage(null);
    if (!confirm("Mark this story as finished? No new parts or replies until you unlock it.")) {
      return;
    }
    if (lockForum(forum.id, creatorUsername)) {
      setMessage("Story locked. You can publish to the Shop or unlock later.");
    }
  }

  function handleUnlock() {
    setError(null);
    setMessage(null);
    if (unlockForum(forum.id, creatorUsername)) {
      setMessage("Story unlocked — writers can continue again.");
    }
  }

  function handlePublishShop() {
    setError(null);
    setMessage(null);
    const dollars = Number.parseFloat(shopPrice.replace(",", "."));
    if (Number.isNaN(dollars) || dollars < 1) {
      setError("Enter a price of at least $1.00.");
      return;
    }
    if (!forum.book_cover_url) {
      setError("Add a book cover before publishing to the Shop.");
      return;
    }
    const postId = publishForumToShop(
      forum.id,
      creatorUsername,
      Math.round(dollars * 100)
    );
    if (!postId) {
      setError("Could not publish — story must be locked first.");
      return;
    }
    setMessage("Submitted to Shop (pending editor review). Readers must purchase to read.");
  }

  return (
    <section className="comic-panel p-4 space-y-3 border-2 border-dashed border-ink bg-comic-yellow/20">
      <h2 className="font-comic text-sm text-ink flex items-center gap-2">
        Creator controls
        {forum.is_private && (
          <Badge variant="tag" className="text-[10px]">
            Private
          </Badge>
        )}
        {forum.is_locked && (
          <Badge variant="paid" className="text-[10px]">
            Finished
          </Badge>
        )}
      </h2>

      <p className="text-xs text-ink-muted">
        Lock when the story is done. Optionally sell it on the Shop — agree with your co-writers
        first. Only locked topics can be listed for sale.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={handlePrivateToggle}>
          {forum.is_private ? "Make public" : "Make private"}
        </Button>
        {!forum.is_locked ? (
          <Button type="button" variant="secondary" size="sm" onClick={handleLock}>
            <Lock className="h-3.5 w-3.5 mr-1" />
            Mark finished &amp; lock
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={handleUnlock}>
            <LockOpen className="h-3.5 w-3.5 mr-1" />
            Unlock for more writing
          </Button>
        )}
      </div>

      {forum.is_locked && !forum.shop_post_id && (
        <div className="flex flex-wrap items-end gap-2 pt-1 border-t border-dashed border-ink">
          <div>
            <label className="block text-xs font-comic text-ink mb-1">Shop price (USD)</label>
            <input
              type="text"
              value={shopPrice}
              onChange={(e) => setShopPrice(e.target.value)}
              className="w-24 border-2 border-ink px-2 py-1 text-sm bg-surface"
            />
          </div>
          <Button type="button" variant="comic" size="sm" onClick={handlePublishShop}>
            <ShoppingBag className="h-3.5 w-3.5 mr-1" />
            Publish to Shop
          </Button>
        </div>
      )}

      {forum.shop_post_id && (
        <p className="text-xs font-comic text-comic-red">
          Listed on Shop ·{" "}
          {forum.shop_price_cents ? formatPrice(forum.shop_price_cents) : "paid"}{" "}
          <Link href={`/post/${forum.shop_post_id}`} className="underline ml-1">
            View listing →
          </Link>
        </p>
      )}

      {message && <p className="text-xs font-comic text-ink">{message}</p>}
      {error && <p className="text-xs font-comic text-comic-red">{error}</p>}
    </section>
  );
}
