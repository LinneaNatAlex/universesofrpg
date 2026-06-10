"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Code2,
  BookOpen,
  UserCircle,
  ImageIcon,
  PenLine,
  Store,
} from "lucide-react";
import { AssetTeaserPreview } from "@/components/content/AssetTeaserPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
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
  const Icon = TYPE_ICONS[post.type];

  function handlePurchase() {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    alert(
      `Purchase flow for "${post.title}" (${formatPrice(post.price_cents)}) — Stripe coming soon.`
    );
  }

  return (
    <article className="comic-card flex flex-col h-full">
      <div className="comic-card-inner p-4 flex flex-col flex-1">
        {/* Price strip */}
        <div className="flex items-center justify-between mb-3 px-3 py-2 border-2 border-ink -mx-1 -mt-1 bg-comic-red text-white">
          <span className="font-comic text-lg">{formatPrice(post.price_cents)}</span>
          <Badge variant="comic" className="bg-comic-yellow text-ink">
            <Icon className="h-3 w-3 mr-1 inline" />
            {TYPE_LABELS[post.type]}
          </Badge>
        </div>

        {/* Cover / preview */}
        {post.book_cover_url ? (
          <div className="comic-cover mx-auto mb-3">
            <Image
              src={post.book_cover_url}
              alt=""
              width={120}
              height={168}
              className="object-cover"
              unoptimized
            />
          </div>
        ) : post.type === "digital_asset" && post.preview_image_url ? (
          <AssetTeaserPreview
            src={post.preview_image_url}
            alt={post.title}
            fullAccess={isLoggedIn}
            compact
            className="mb-3"
            hint="Sign in to preview the full pack before buying."
          />
        ) : post.type === "code_template" ? (
          <div className="comic-panel h-24 mb-3 flex items-center justify-center bg-comic-blue/10">
            <Code2 className="h-8 w-8 text-comic-blue opacity-60" />
          </div>
        ) : null}

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
        <div className="mt-3 flex gap-2">
          <Button variant="comic" size="sm" className="flex-1" onClick={handlePurchase}>
            <ShoppingBag className="h-3.5 w-3.5 mr-1" />
            Buy now
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
