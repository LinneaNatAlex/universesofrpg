"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MessageCircle,
  Code2,
  BookOpen,
  UserCircle,
  ImageIcon,
  PenLine,
  Eye,
} from "lucide-react";
import { LikeButton } from "@/components/feed/LikeButton";
import { Badge } from "@/components/ui/badge";
import { AssetTeaserPreview } from "@/components/content/AssetTeaserPreview";
import { LayoutPreview } from "@/components/content/LayoutPreview";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useCommentCount } from "@/hooks/useCommentCount";
import type { FeedPost } from "@/types/database";

const TYPE_ICONS = {
  character_sheet: UserCircle,
  code_template: Code2,
  story_segment: BookOpen,
  digital_asset: ImageIcon,
  collab_thread: MessageCircle,
  text_writing: PenLine,
};

const TYPE_LABELS: Record<FeedPost["type"], string> = {
  character_sheet: "Character",
  code_template: "Template",
  story_segment: "Story",
  digital_asset: "Asset",
  collab_thread: "Collab",
  text_writing: "Writing",
};

interface FeedCardProps {
  post: FeedPost;
}

export function FeedCard({ post }: FeedCardProps) {
  const { isLoggedIn } = useAuth();
  const commentCount = useCommentCount(post.id);
  const Icon = TYPE_ICONS[post.type];
  const synopsis = post.plot_synopsis ?? post.description ?? "";
  const isStoryLike =
    post.type === "story_segment" ||
    post.type === "text_writing" ||
    post.type === "character_sheet" ||
    post.type === "collab_thread";

  return (
    <article className="comic-card group">
      <div className="comic-card-inner p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-ink border-dashed pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="comic-avatar">{post.author.display_name.charAt(0)}</div>
            <div>
              <Link
                href={`/profile/${post.author.username}`}
                className="font-comic font-bold text-ink hover:text-comic-red transition-colors"
              >
                {post.author.display_name}
              </Link>
              <p className="text-xs text-ink-muted">@{post.author.username}</p>
            </div>
          </div>
          <Badge variant="comic">
            <Icon className="h-3 w-3 mr-1 inline" />
            {TYPE_LABELS[post.type]}
          </Badge>
        </div>

        {/* Title + teaser */}
        <Link href={`/post/${post.id}`} className="block group/title">
          <h3 className="font-comic text-xl text-ink group-hover/title:text-comic-red transition-colors">
            {post.title}
          </h3>
        </Link>

        {/* Guest-safe preview by type */}
        <div className="mt-3">
          {post.type === "code_template" && post.html_code && post.css_code && (
            <LayoutPreview
              html={post.html_code}
              css={post.css_code}
              js={post.js_code}
              className="scale-[0.98] origin-top"
            />
          )}

          {post.type === "digital_asset" &&
            (post.preview_image_url ? (
              <AssetTeaserPreview
                src={post.preview_image_url}
                alt={post.title}
                fullAccess={isLoggedIn}
                compact
                hint={post.plot_synopsis ?? post.description ?? undefined}
              />
            ) : (
              <div className="comic-panel p-6 text-center">
                <ImageIcon className="h-8 w-8 mx-auto text-ink-muted opacity-50 mb-2" />
                <p className="text-xs font-comic text-ink-muted">Asset pack — sign in to view</p>
              </div>
            ))}

          {isStoryLike && (
            <div className="flex gap-3 mt-2">
              {post.book_cover_url && (
                <div className="comic-cover shrink-0 hidden sm:block">
                  <Image
                    src={post.book_cover_url}
                    alt=""
                    width={72}
                    height={100}
                    className="object-cover opacity-90"
                    unoptimized
                  />
                </div>
              )}
              <p className="text-sm text-ink-muted italic leading-relaxed line-clamp-4 flex-1">
                {synopsis}
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.pricing === "free" ? (
            <Badge variant="free">Free</Badge>
          ) : (
            <Badge variant="paid">{formatPrice(post.price_cents)}</Badge>
          )}
          {post.style_tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="tag">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t-2 border-ink border-dashed pt-3">
          <Link
            href={`/post/${post.id}`}
            className="inline-flex items-center gap-1 text-xs font-comic text-comic-red hover:underline"
          >
            <Eye className="h-3.5 w-3.5" />
            View teaser
          </Link>
          <div className="flex items-center gap-3 text-sm text-ink-muted">
            {isLoggedIn && (
              <LikeButton postId={post.id} initialCount={post.like_count} />
            )}
            <Link
              href={`/post/${post.id}#comments`}
              className="flex items-center gap-1 text-xs hover:text-comic-red transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {commentCount}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
