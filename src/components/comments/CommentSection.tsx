"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { usePostComments } from "@/hooks/usePostComments";
import { addComment } from "@/lib/mock-comments";
import { Button } from "@/components/ui/button";
import type { Comment } from "@/types/database";
import { MessageCircle } from "lucide-react";

interface CommentSectionProps {
  postId: string;
}

function formatCommentDate(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { isLoggedIn, loading } = useAuth();
  const identity = useActingIdentity();
  const comments = usePostComments(postId);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !isLoggedIn || !identity) return;

    setSubmitting(true);

    const newComment: Comment = {
      id: `local-${Date.now()}`,
      post_id: postId,
      author_id: identity.authorId,
      author_username: identity.username,
      author_display_name: identity.displayName,
      body,
      created_at: new Date().toISOString(),
    };

    addComment(newComment);
    setDraft("");
    setSubmitting(false);

    // TODO: persist to Supabase comments table
  }

  return (
    <section id="comments" className="comic-panel p-5 space-y-4 scroll-mt-8">
      <div className="flex items-center gap-2 border-b-2 border-dashed border-ink pb-3">
        <MessageCircle className="h-5 w-5 text-comic-red" />
        <h2 className="font-comic text-xl text-ink">
          Comments <span className="text-ink-muted">({comments.length})</span>
        </h2>
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-ink-muted italic text-center py-4">
          {isLoggedIn
            ? "No comments yet. Be the first to share your thoughts!"
            : "No comments yet. Sign in to leave the first one."}
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="border-l-4 border-comic-yellow pl-4 py-1"
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <Link
                  href={`/profile/${comment.author_username}`}
                  className="font-comic text-sm text-comic-red hover:underline"
                >
                  {comment.author_display_name}
                </Link>
                <span className="text-xs text-ink-muted">
                  @{comment.author_username} · {formatCommentDate(comment.created_at)}
                </span>
              </div>
              <p className="text-sm mt-1 leading-relaxed text-ink">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      {!loading && isLoggedIn ? (
        <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t-2 border-dashed border-ink">
          <label className="font-comic text-sm text-ink block">Leave a comment</label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Share your thoughts…"
            className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm resize-y min-h-[80px]"
            required
          />
          <Button
            type="submit"
            variant="comic"
            size="sm"
            disabled={submitting || !draft.trim()}
          >
            {submitting ? "Posting…" : "Post comment"}
          </Button>
        </form>
      ) : (
        !loading && (
          <p className="text-sm text-ink-muted text-center pt-2 border-t-2 border-dashed border-ink">
            <Link href="/login" className="text-comic-red font-comic hover:underline">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="text-comic-red font-comic hover:underline">
              create an account
            </Link>{" "}
            to leave a comment.
          </p>
        )
      )}
    </section>
  );
}
