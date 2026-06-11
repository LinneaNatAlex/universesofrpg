"use client";

import Link from "next/link";
import {
  ShoppingBag,
  Code2,
  BookOpen,
  UserCircle,
  ImageIcon,
  PenLine,
  Store,
} from "lucide-react";
import { PostCoverThumbnail } from "@/components/content/PostCoverThumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useMarketplaceBuy } from "@/hooks/useMarketplaceBuy";
import { PurchaseCount } from "@/components/marketplace/PurchaseCount";
import { getPublicTemplatePreviewBundle } from "@/lib/post-template-preview";
import type { FeedPost } from "@/types/database";

const TYPE_LABELS: Record<FeedPost["type"], string> = {
  character_sheet: "Character pack",
  code_template: "Profile theme",
  story_segment: "Story arc",
  digital_asset: "Asset bundle",
  collab_thread: "World kit",
  text_writing: "Writing pack",
};

const TYPE_ICONS = {
  character_sheet: UserCircle,
  code_template: Code2,
  story_segment: BookOpen,
  digital_asset: ImageIcon,
  collab_thread: BookOpen,
  text_writing: PenLine,
};

interface MarketplaceCardProps {
  post: FeedPost;
}

export function MarketplaceCard({ post }: MarketplaceCardProps) {
  const { isLoggedIn } = useAuth();
  const identity = useActingIdentity();
  const { buy, busy, error } = useMarketplaceBuy();
  const Icon = TYPE_ICONS[post.type];

  async function handlePurchase() {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    if (!identity?.username) return;

    const ok = await buy(
      {
        post_id: post.id,
        title: post.title,
        price_cents: post.price_cents,
        seller_username: post.author.username,
      },
      identity.username,
      () => {
        if (post.type === "code_template") {
          window.location.href = `/post/${post.id}`;
        }
      }
    );

    if (ok && post.type === "code_template") {
      window.location.href = `/post/${post.id}`;
    }
  }

  return (
    <article className="comic-card flex flex-col h-full">
      <div className="comic-card-inner p-4 flex flex-col flex-1">
        {/* Price strip */}
        <div className="flex items-center justify-between mb-3 px-3 py-2 border-2 border-ink -mx-1 -mt-1 bg-comic-red text-white">
          <div className="flex flex-col gap-0.5">
            <span className="font-comic text-lg">{formatPrice(post.price_cents)}</span>
            <PurchaseCount
              postId={post.id}
              className="text-white/90 text-[10px]"
            />
          </div>
          <Badge variant="comic" className="bg-comic-yellow text-ink">
            <Icon className="h-3 w-3 mr-1 inline" />
            {TYPE_LABELS[post.type]}
          </Badge>
        </div>

        <div className="mx-auto mb-3 flex justify-center">
          <PostCoverThumbnail post={post} size="md" coverOnly />
        </div>

        <Link href={`/post/${post.id}`} className="block group">
          <h3 className="font-comic text-lg text-ink group-hover:text-comic-red leading-tight">
            {post.title}
          </h3>
        </Link>

        <p className="text-xs text-ink-muted italic mt-2 line-clamp-2 flex-1">
          {post.plot_synopsis ?? post.description}
        </p>

        {/* Seller */}
        <Link
          href={`/profile/${post.author.username}`}
          className="flex items-center gap-2 mt-3 pt-3 border-t border-dashed border-ink text-xs hover:text-comic-red"
        >
          <Store className="h-3.5 w-3.5 shrink-0" />
          <span className="font-comic">{post.author.display_name}</span>
          {post.author.is_verified_creator && (
            <Badge variant="tag" className="text-[10px] py-0">
              Verified
            </Badge>
          )}
        </Link>

        {/* Actions */}
        {error && (
          <p className="mt-2 text-xs text-comic-red font-comic leading-snug">{error}</p>
        )}

        <div className="mt-3 flex gap-2">
          <Button
            variant="comic"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={() => void handlePurchase()}
          >
            <ShoppingBag className="h-3.5 w-3.5 mr-1" />
            {busy ? "Opening checkout…" : "Buy now"}
          </Button>
          <Link href={`/post/${post.id}`} className="flex-1">
            <Button variant="comic-outline" size="sm" className="w-full">
              Preview
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
