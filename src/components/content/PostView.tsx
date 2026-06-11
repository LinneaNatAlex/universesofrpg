"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getEditorReviewConversationForPost,
  subscribeMessages,
} from "@/lib/messages-store";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { ReportDialog } from "@/components/reports/ReportDialog";
import { useEditor } from "@/hooks/useEditor";
import {
  canViewCodeLivePreview,
  canViewCodePreview,
  canViewFullContent,
  requiresCodePurchase,
  resolvePostForViewer,
} from "@/lib/posts";
import { moderationStatusLabel } from "@/lib/moderation";
import { CodeSourcePanel } from "@/components/content/CodeSourcePanel";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { BookBackCover } from "@/components/content/BookBackCover";
import { AssetTeaserPreview } from "@/components/content/AssetTeaserPreview";
import { LayoutPreview } from "@/components/content/LayoutPreview";
import { Badge } from "@/components/ui/badge";
import { CommentSection } from "@/components/comments/CommentSection";
import { PostEngagementBar } from "@/components/feed/PostEngagementBar";
import type { FeedPost } from "@/types/database";

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

export function PostView({ post: rawPost }: PostViewProps) {
  const { isLoggedIn } = useAuth();
  const identity = useActingIdentity();
  const { isEditor } = useEditor();
  const [editorChatId, setEditorChatId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");

  const viewer = {
    isLoggedIn,
    username: identity?.username ?? null,
    inviteToken: invite,
    isEditor,
  };
  const post = resolvePostForViewer(rawPost, viewer);
  const fullAccess = canViewFullContent(isLoggedIn, invite, post.invite_token);
  const codeIsFree = post.type === "code_template" && !requiresCodePurchase(post);
  const showLiveCodePreview = canViewCodeLivePreview(rawPost, viewer);
  const showCodeSection = canViewCodePreview(rawPost);
  const synopsis = post.plot_synopsis ?? post.description ?? "";

  const accessMessage =
    post.pricing === "free"
      ? "This work is free — join to unlock the full content."
      : "Sign in to preview. Purchase is required for premium downloads.";

  const isAuthor =
    identity?.username.toLowerCase() === post.author.username.toLowerCase();

  useEffect(() => {
    if (post.moderation_status !== "pending") {
      setEditorChatId(null);
      return;
    }
    const refresh = () => {
      const conv = getEditorReviewConversationForPost(post.id);
      setEditorChatId(conv?.id ?? null);
    };
    refresh();
    return subscribeMessages(refresh);
  }, [post.id, post.moderation_status]);

  return (
    <article
      className={`space-y-6 mx-auto ${
        post.type === "code_template" ? "max-w-7xl" : "max-w-3xl"
      }`}
    >
      {post.moderation_status === "pending" && (
        <div className="comic-panel px-4 py-2 text-xs font-comic text-comic-red text-center bg-comic-yellow/40 space-y-1">
          <p>
            {moderationStatusLabel(post.moderation_status)} — visible to you and editors until
            approved.
          </p>
          {isAuthor && editorChatId && (
            <Link href={`/messages/${editorChatId}`} className="text-comic-red underline">
              Open editor chat about this listing →
            </Link>
          )}
        </div>
      )}
      {!fullAccess && !codeIsFree && (
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="comic">{post.type.replace("_", " ")}</Badge>
          {post.pricing === "free" ? (
            <Badge variant="free">Free</Badge>
          ) : (
            <Badge variant="paid">Paid</Badge>
          )}
          {isLoggedIn && identity && (
            <ReportDialog
              targetType="post"
              reporterUsername={identity.username}
              reporterDisplayName={identity.displayName}
              postId={post.id}
              postTitle={post.title}
              label="Report post"
              className="ml-auto"
            />
          )}
        </div>
      </header>

      {/* Code templates — cover teaser until purchase; live preview + source after unlock */}
      {showCodeSection && (
        <section className="space-y-4">
          <div>
            <p className="font-comic text-sm text-ink mb-2">
              {showLiveCodePreview ? "Live template preview" : "Template preview"}
            </p>
            {showLiveCodePreview && post.html_code && post.css_code ? (
              <LayoutPreview
                html={post.html_code}
                css={post.css_code}
                js={post.js_code}
                mode="full"
                height={240}
                sourceLocked={requiresCodePurchase(post)}
                defaultViewport="desktop"
              />
            ) : rawPost.preview_image_url ? (
              <AssetTeaserPreview
                src={rawPost.preview_image_url}
                alt={post.title}
                fullAccess
                hint="Purchase to unlock the live template and full HTML, CSS, and JavaScript source."
              />
            ) : null}
          </div>
          <div>
            <p className="font-comic text-sm text-ink mb-2">
              {codeIsFree ? "Source code — free to copy" : "Source code"}
            </p>
            <CodeSourcePanel post={rawPost} inviteToken={invite} />
          </div>
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

      <div className="comic-panel px-4 py-3 flex items-center justify-between border-2 border-ink">
        <p className="text-xs font-comic text-ink-muted uppercase">Community</p>
        <PostEngagementBar
          postId={post.id}
          likeCount={post.like_count}
          isPaid={post.pricing !== "free"}
        />
      </div>

      <div id="comments">
        <CommentSection postId={post.id} />
      </div>
    </article>
  );
}
