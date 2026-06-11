"use client";

import Link from "next/link";
import { useMarketplaceBuy } from "@/hooks/useMarketplaceBuy";
import { formatPrice } from "@/lib/utils";
import type { RpgForum } from "@/types/database";
import { Button } from "@/components/ui/button";

interface TopicShopGateProps {
  forum: RpgForum;
  username: string;
  onPurchased: () => void;
}

export function TopicShopGate({ forum, username, onPurchased }: TopicShopGateProps) {
  const price = forum.shop_price_cents ?? 0;
  const { buy, busy, error } = useMarketplaceBuy();

  async function handlePurchase() {
    if (!forum.shop_post_id || price < 100) return;

    const result = await buy({
      post_id: forum.shop_post_id,
      title: forum.title,
      price_cents: price,
      seller_username: forum.creator_username,
    });
    if (result === "unlocked") onPurchased();
  }

  return (
    <div className="comic-panel p-6 space-y-4 text-center max-w-lg mx-auto">
      <h2 className="font-comic text-xl text-ink">Premium RPG story</h2>
      {forum.plot_synopsis && (
        <p className="text-sm text-ink-muted italic leading-relaxed">{forum.plot_synopsis}</p>
      )}
      <p className="text-sm text-ink-muted">
        This topic is finished and sold on the Shop. Purchase to read all parts and replies.
      </p>
      {price > 0 && (
        <p className="font-comic text-2xl text-comic-red">{formatPrice(price)}</p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant="comic"
          size="sm"
          disabled={busy || !forum.shop_post_id}
          onClick={() => void handlePurchase()}
        >
          {busy ? "Opening checkout…" : "Buy now"}
        </Button>
        {error && <p className="text-xs text-comic-red font-comic w-full">{error}</p>}
        {forum.shop_post_id && (
          <Link href={`/post/${forum.shop_post_id}`}>
            <Button type="button" variant="secondary" size="sm">
              View Shop listing
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
