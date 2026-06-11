"use client";

import Link from "next/link";
import { recordPurchase } from "@/lib/purchases-store";
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

  function handleDemoPurchase() {
    if (!forum.shop_post_id) return;
    recordPurchase(username, forum.shop_post_id);
    onPurchased();
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
        <Button type="button" variant="comic" size="sm" onClick={handleDemoPurchase}>
          Buy (demo unlock)
        </Button>
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
