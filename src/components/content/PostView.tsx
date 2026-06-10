"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { canViewFullContent } from "@/lib/posts";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { BookBackCover } from "@/components/content/BookBackCover";
import { AssetTeaserPreview } from "@/components/content/AssetTeaserPreview";
import { LayoutPreview } from "@/components/content/LayoutPreview";
import { Badge } from "@/components/ui/badge";
import { CommentSection } from "@/components/comments/CommentSection";
import type { FeedPost } from "@/types/database";
import { Lock } from "lucide-react";

interface PostViewProps {
  post: FeedPost;
}

function isStoryLike(type: FeedPost["type"]) {
  return (
    type === "story_segment" ||
    type === "text_writing" ||
    type === "character_sheet" ||
    type === "collab_thread"
  );
}

export function PostView({ post }: PostViewProps) {
  const { isLoggedIn } = useAuth();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const fullAccess = canViewFullContent(isLoggedIn, invite, post.invite_token);
  const synopsis = post.plot_synopsis ?? post.description ?? "";

  const accessMessage =
    post.pricing === "free"
      ? "This work is free — join to unlock the full content."
      : "Sign in to preview. Purchase is required for premium downloads.";

  return (
    <article className="space-y-6 max-w-3xl mx-auto">
      {!fullAccess && (
        <p className="comic-panel px-4 py-2 text-xs font-comic text-ink-muted text-center">
          You&apos;re viewing a teaser. Sign up to unlock full content
          {post.pricing !== "free" ? " (premium may require purchase)." : "."}
        </p>
      )}
      <header className="space-y-2">
        <Link
          href={`/profile/${post.author.username}`}
          className="text-sm font-comic text-comic-red hover:underline"
        >
          @{post.author.username}
        </Link>
        <h1 className="font-comic text-3xl md:text-4xl text-ink">{post.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="comic">{post.type.replace("_", " ")}</Badge>
          {post.pricing === "free" ? (
            <Badge variant="free">Free</Badge>
          ) : (
            <Badge variant="paid">Paid</Badge>
          )}
        </div>
      </header>

      {/* Code — guests see layout only */}
      {post.type === "code_template" && post.html_code && post.css_code && (
        <section className="space-y-4">
          <LayoutPreview html={post.html_code} css={post.css_code} js={post.js_code} />
          {fullAccess ? (
            <div className="comic-panel p-4 font-mono text-xs overflow-auto max-h-64">
              <pre>{post.html_code}</pre>
            </div>
          ) : (
            <LoginCTA message="Join free to view and fork the source code." />
          )}
        </section>
      )}

      {/* Asset / image previews */}
      {(post.type === "digital_asset" || post.preview_image_url) &&
        post.type !== "code_template" &&
        post.preview_image_url && (
          <section className="space-y-3">
            <AssetTeaserPreview
              src={post.preview_image_url}
              alt={post.title}
              fullAccess={fullAccess}
              hint={
                post.type === "digital_asset"
                  ? (post.plot_synopsis ?? post.description ?? "Full-resolution pack for members.")
                  : undefined
              }
            />
            {!fullAccess && (
              <LoginCTA message={accessMessage} />
            )}
          </section>
        )}

      {/* Story / text — back-of-book for guests */}
      {isStoryLike(post.type) && (
        <section className="space-y-4">
          <BookBackCover
            title={post.title}
            synopsis={synopsis}
            coverUrl={post.book_cover_url}
          />
          {fullAccess ? (
            <div className="comic-panel p-6 prose-comic">
              <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>
              {post.bbcode && (
                <p className="mt-4 text-sm text-ink-muted font-mono">{post.bbcode}</p>
              )}
            </div>
          ) : (
            <LoginCTA message={accessMessage} />
          )}
        </section>
      )}

      {post.is_code_locked && fullAccess && (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Lock className="h-4 w-4" /> Premium code blocks are locked until purchase.
        </p>
      )}

      <CommentSection postId={post.id} />
    </article>
  );
}
