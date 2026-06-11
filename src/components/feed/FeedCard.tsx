"use client";

import Link from "next/link";
import {
  MessageCircle,
  Code2,
  BookOpen,
  UserCircle,
  ImageIcon,
  PenLine,
  Eye,
} from "lucide-react";
import { PostDetailLink } from "@/components/content/PostDetailLink";
import { PostEngagementBar } from "@/components/feed/PostEngagementBar";
import { useAuth } from "@/hooks/useAuth";
import { postDetailHref } from "@/lib/post-access";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { PostCoverThumbnail } from "@/components/content/PostCoverThumbnail";
import { formatPrice } from "@/lib/utils";
import { requiresCodePurchase } from "@/lib/posts";
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
  const Icon = TYPE_ICONS[post.type] ?? Code2;
  const synopsis = post.plot_synopsis ?? post.description ?? "";
  const coverOnly =
    post.type === "code_template" ||
    post.pricing !== "free" ||
    requiresCodePurchase(post);

  return (
    <article className="comic-card group">
      <div className="comic-card-inner p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-ink border-dashed pb-3 mb-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              username={post.author.username}
              displayName={post.author.display_name}
              avatarUrl={post.author.avatar_url}
              size="sm"
            />
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

        {/* Title */}
        <PostDetailLink post={post} className="block group/title">
          <h3 className="font-comic text-xl text-ink group-hover/title:text-comic-red transition-colors">
            {post.title}
          </h3>
        </PostDetailLink>

        {/* Uniform cover + teaser for every post type */}
        <PostDetailLink post={post} className="block mt-3 group/teaser">
          <div className="flex gap-3 items-start">
            <PostCoverThumbnail
              post={post}
              size="feed"
              coverOnly={coverOnly}
              className="shrink-0"
            />
            <p className="text-sm text-ink-muted italic leading-relaxed line-clamp-5 flex-1 min-w-0 group-hover/teaser:text-ink transition-colors">
              {synopsis || "Open to read the full teaser…"}
            </p>
          </div>
        </PostDetailLink>

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
          <PostDetailLink
            post={post}
            className="inline-flex items-center gap-1 text-xs font-comic text-comic-red hover:underline"
          >
            <Eye className="h-3.5 w-3.5" />
            {post.type === "code_template" && !isLoggedIn ? "Sign in to view" : "View teaser"}
          </PostDetailLink>
          <PostEngagementBar
            postId={post.id}
            likeCount={post.like_count}
            isPaid={post.pricing !== "free"}
            commentsHref={postDetailHref(post, isLoggedIn, "comments")}
            className="relative z-10 gap-3"
          />
        </div>
      </div>
    </article>
  );
}
