"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEditor } from "@/hooks/useEditor";
import { findOrCreateEditorReviewChat } from "@/lib/messages-store";
import { addEditorReview } from "@/lib/editor-reviews-store";
import { incrementEditorReviews } from "@/lib/editor-profiles-store";
import { getEditorLevelMeta } from "@/lib/editor-constants";
import { moderationStatusLabel } from "@/lib/moderation";
import {
  getAllPosts,
  setPostModeration,
  subscribePosts,
} from "@/lib/posts-store";
import { EditorBadge } from "@/components/editor/EditorBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { FeedPost } from "@/types/database";
import { Check, MessageCircle, X } from "lucide-react";

export function EditorReviewQueue() {
  const router = useRouter();
  const { level, username, displayName, canReviewPaid } = useEditor();
  const [pending, setPending] = useState<FeedPost[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    const refresh = () => {
      const posts = getAllPosts().filter((p) => p.moderation_status === "pending");
      setPending(posts);
    };
    refresh();
    return subscribePosts(refresh);
  }, []);

  if (!level || !username || !displayName) return null;

  const meta = getEditorLevelMeta(level);
  const visible = pending.filter((p) => p.pricing === "free" || canReviewPaid);

  function handleDecision(post: FeedPost, decision: "approved" | "rejected") {
    if (!username || !displayName || !level) return;

    setPostModeration(post.id, decision);
    addEditorReview({
      post_id: post.id,
      post_title: post.title,
      editor_username: username,
      editor_display_name: displayName,
      editor_level: level,
      decision,
      feedback: feedback[post.id]?.trim() || null,
      quality_score: decision === "approved" ? 4 : null,
    });
    incrementEditorReviews(username);
  }

  function openCreatorChat(post: FeedPost) {
    if (!username || !displayName) return;
    const conv = findOrCreateEditorReviewChat(
      username,
      displayName,
      post.author.username,
      post.author.display_name,
      post.id,
      post.title
    );
    router.push(`/messages/${conv.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="comic-panel p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <EditorBadge level={level} />
          <p className="text-xs text-ink-muted mt-2">{meta.description}</p>
          <p className="text-xs text-ink-muted">Rate range: {meta.rateRange}</p>
        </div>
        <p className="font-comic text-2xl text-comic-red">{visible.length} pending</p>
      </div>

      {visible.length === 0 ? (
        <p className="comic-panel p-8 text-center text-ink-muted font-comic">
          No posts awaiting your review.
        </p>
      ) : (
        visible.map((post) => (
          <div key={post.id} className="comic-panel p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link href={`/post/${post.id}`} className="font-comic text-lg text-ink hover:text-comic-red">
                  {post.title}
                </Link>
                <p className="text-xs text-ink-muted mt-1">
                  by @{post.author.username} · {post.type} · {moderationStatusLabel(post.moderation_status)}
                </p>
              </div>
              <div className="flex gap-2">
                {post.pricing === "free" ? (
                  <Badge variant="free">Free</Badge>
                ) : (
                  <Badge variant="paid">{formatPrice(post.price_cents)}</Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-ink-muted italic line-clamp-3">
              {post.plot_synopsis ?? post.description}
            </p>
            {!canReviewPaid && post.pricing !== "free" && (
              <p className="text-xs text-comic-red font-comic">
                Your level cannot review paid Shop listings — escalate to Standard+.
              </p>
            )}
            <textarea
              value={feedback[post.id] ?? ""}
              onChange={(e) => setFeedback((f) => ({ ...f, [post.id]: e.target.value }))}
              rows={2}
              placeholder="Optional feedback for the creator…"
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => openCreatorChat(post)}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                Message creator
              </Button>
              <Button variant="comic" size="sm" onClick={() => handleDecision(post, "approved")}>
                <Check className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDecision(post, "rejected")}>
                <X className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
