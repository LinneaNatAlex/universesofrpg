"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { usePostComments } from "@/hooks/usePostComments";
import { addComment } from "@/lib/mock-comments";
import { Button } from "@/components/ui/button";
import { CommentAuthorRow } from "@/components/comments/CommentAuthorRow";
import { ReportDialog } from "@/components/reports/ReportDialog";
import type { Comment } from "@/types/database";
import { MessageCircle, X } from "lucide-react";

interface CommentSectionProps {
  postId: string;
}

interface CommentNode extends Comment {
  replies: CommentNode[];
}

function formatCommentDate(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function buildCommentTree(comments: Comment[]): CommentNode[] {
  const byParent = new Map<string | null, Comment[]>();

  for (const comment of comments) {
    const key = comment.parent_comment_id;
    const bucket = byParent.get(key) ?? [];
    bucket.push(comment);
    byParent.set(key, bucket);
  }

  const sortOldest = (list: Comment[]) =>
    [...list].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  function attach(comment: Comment): CommentNode {
    const replies = sortOldest(byParent.get(comment.id) ?? []).map(attach);
    return { ...comment, replies };
  }

  return sortOldest(byParent.get(null) ?? []).map(attach);
}

function countAllComments(nodes: CommentNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countAllComments(node.replies), 0);
}

interface ReplyTarget {
  id: string;
  username: string;
  displayName: string;
}

interface CommentItemProps {
  node: CommentNode;
  postId: string;
  depth: number;
  identity: ReturnType<typeof useActingIdentity>;
  isLoggedIn: boolean;
  onReply: (target: ReplyTarget) => void;
}

function CommentItem({
  node,
  postId,
  depth,
  identity,
  isLoggedIn,
  onReply,
}: CommentItemProps) {
  const canReport =
    isLoggedIn &&
    identity &&
    identity.username.toLowerCase() !== node.author_username.toLowerCase();

  return (
    <li className={depth > 0 ? "mt-3" : undefined}>
      <div
        className={`border-l-4 border-comic-yellow py-2 ${
          depth > 0 ? "ml-4 md:ml-8 pl-3 bg-surface/50" : "pl-3"
        }`}
      >
        <CommentAuthorRow
          username={node.author_username}
          displayName={node.author_display_name}
          meta={
            <>
              @{node.author_username} · {formatCommentDate(node.created_at)}
            </>
          }
          actions={
            <div className="flex flex-col items-end gap-1">
              {canReport && (
                <ReportDialog
                  compact
                  targetType="comment"
                  reporterUsername={identity.username}
                  reporterDisplayName={identity.displayName}
                  postId={postId}
                  commentId={node.id}
                  targetUsername={node.author_username}
                  targetDisplayName={node.author_display_name}
                  label="Report"
                />
              )}
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() =>
                    onReply({
                      id: node.id,
                      username: node.author_username,
                      displayName: node.author_display_name,
                    })
                  }
                  className="text-[11px] font-comic text-ink-muted hover:text-comic-red transition-colors"
                >
                  Reply
                </button>
              )}
            </div>
          }
        >
          <p className="text-sm leading-relaxed text-ink mt-2">{node.body}</p>
        </CommentAuthorRow>
      </div>

      {node.replies.length > 0 && (
        <ul className="space-y-0">
          {node.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              node={reply}
              postId={postId}
              depth={depth + 1}
              identity={identity}
              isLoggedIn={isLoggedIn}
              onReply={onReply}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { isLoggedIn, loading } = useAuth();
  const identity = useActingIdentity();
  const comments = usePostComments(postId);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tree = useMemo(() => buildCommentTree(comments), [comments]);
  const totalCount = useMemo(() => countAllComments(tree), [tree]);

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
      parent_comment_id: replyTo?.id ?? null,
      created_at: new Date().toISOString(),
    };

    addComment(newComment);
    setDraft("");
    setReplyTo(null);
    setSubmitting(false);
  }

  return (
    <section id="comments" className="comic-panel p-5 space-y-4 scroll-mt-8">
      <div className="flex items-center gap-2 border-b-2 border-dashed border-ink pb-3">
        <MessageCircle className="h-5 w-5 text-comic-red" />
        <h2 className="font-comic text-xl text-ink">
          Comments <span className="text-ink-muted">({totalCount})</span>
        </h2>
      </div>

      {tree.length === 0 ? (
        <p className="text-sm text-ink-muted italic text-center py-4">
          {isLoggedIn
            ? "No comments yet. Be the first to share your thoughts!"
            : "No comments yet. Sign in to leave the first one."}
        </p>
      ) : (
        <ul className="space-y-4">
          {tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              postId={postId}
              depth={0}
              identity={identity}
              isLoggedIn={isLoggedIn}
              onReply={setReplyTo}
            />
          ))}
        </ul>
      )}

      {!loading && isLoggedIn ? (
        <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t-2 border-dashed border-ink">
          {identity && (
            <CommentAuthorRow
              username={identity.username}
              displayName={identity.displayName}
              avatarUrl={identity.profile?.avatar_url}
              meta="Posting as you"
              size="xs"
            />
          )}
          {replyTo && (
            <div className="flex items-center justify-between gap-2 text-xs font-comic bg-comic-yellow/40 border border-ink px-3 py-2">
              <span>
                Replying to{" "}
                <Link
                  href={`/profile/${replyTo.username}`}
                  className="text-comic-red hover:underline"
                >
                  {replyTo.displayName}
                </Link>
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-ink-muted hover:text-comic-red"
                aria-label="Cancel reply"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <label className="font-comic text-sm text-ink block">
            {replyTo ? "Your reply" : "Leave a comment"}
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder={
              replyTo
                ? `Reply to ${replyTo.displayName}…`
                : "Share your thoughts…"
            }
            className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm resize-y min-h-[80px]"
            required
          />
          <Button
            type="submit"
            variant="comic"
            size="sm"
            disabled={submitting || !draft.trim()}
          >
            {submitting ? "Posting…" : replyTo ? "Post reply" : "Post comment"}
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
