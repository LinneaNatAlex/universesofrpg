"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { LikeButton } from "@/components/feed/LikeButton";
import { PurchaseCount } from "@/components/marketplace/PurchaseCount";
import { useCommentCount } from "@/hooks/useCommentCount";
import { cn } from "@/lib/utils";

interface PostEngagementBarProps {
  postId: string;
  likeCount: number;
  className?: string;
  /** Show how many buyers purchased this paid listing. */
  isPaid?: boolean;
  /** Use anchor on same page (post view) vs link to post comments (feed cards). */
  commentsHref?: string;
}

export function PostEngagementBar({
  postId,
  likeCount,
  className,
  isPaid = false,
  commentsHref = `#comments`,
}: PostEngagementBarProps) {
  const commentCount = useCommentCount(postId);
  const commentsClassName =
    "flex items-center gap-1 text-xs font-comic hover:text-comic-red transition-colors";

  return (
    <div className={cn("flex items-center gap-4 text-sm text-ink-muted", className)}>
      <LikeButton postId={postId} initialCount={likeCount} />
      {isPaid && <PurchaseCount postId={postId} compact={!commentsHref.startsWith("#")} />}
      {commentsHref.startsWith("#") ? (
        <a href={commentsHref} className={commentsClassName}>
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount} comments</span>
        </a>
      ) : (
        <Link href={commentsHref} className={commentsClassName}>
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount}</span>
        </Link>
      )}
    </div>
  );
}
