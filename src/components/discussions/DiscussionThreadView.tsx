"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useDiscussion } from "@/hooks/useDiscussion";
import { useDiscussionReplies } from "@/hooks/useDiscussionReplies";
import {
  addDiscussionReply,
  recordDiscussionView,
} from "@/lib/discussions-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { CommentAuthorRow } from "@/components/comments/CommentAuthorRow";
import { useContentViewer } from "@/hooks/useContentViewer";
import { canViewRatedContent, hasSexualContent } from "@/lib/content-rating";
import { ContentRatingBadge } from "@/components/content/ContentRatingBadge";
import { MatureContentGate } from "@/components/content/MatureContentGate";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function DiscussionThreadView({ id }: { id: string }) {
  const { isLoggedIn, loading } = useAuth();
  const identity = useActingIdentity();
  const { ctx: viewerCtx } = useContentViewer();
  const thread = useDiscussion(id);
  const replies = useDiscussionReplies(id);
  const [draft, setDraft] = useState("");
  const [viewRecorded, setViewRecorded] = useState(false);

  useEffect(() => {
    if (!thread || viewRecorded) return;
    recordDiscussionView(thread.id);
    setViewRecorded(true);
  }, [thread, viewRecorded]);

  if (thread === undefined) {
    return (
      <div className="comic-panel p-8 text-center font-comic text-ink-muted max-w-3xl mx-auto w-full">
        Loading discussion…
      </div>
    );
  }

  if (thread === null) {
    return (
      <div className="comic-panel p-8 text-center space-y-3 max-w-3xl mx-auto w-full">
        <h1 className="font-comic text-xl text-ink">Discussion not found</h1>
        <Link href="/discussions" className="font-comic text-comic-red hover:underline text-sm">
          ← Back to forum
        </Link>
      </div>
    );
  }

  function handleReply(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !identity) return;
    addDiscussionReply({
      thread_id: id,
      author_username: identity.username,
      author_display_name: identity.displayName,
      body,
    });
    setDraft("");
  }

  if (hasSexualContent(thread) && !canViewRatedContent(thread, viewerCtx)) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto w-full">
        <Link
          href="/discussions"
          className="inline-flex items-center gap-1 text-sm font-comic text-ink-muted hover:text-comic-red"
        >
          <ArrowLeft className="h-4 w-4" /> Forum discussions
        </Link>
        <div className="text-center space-y-2">
          <h1 className="font-comic text-2xl text-ink">{thread.title}</h1>
          <ContentRatingBadge item={thread} />
        </div>
        <MatureContentGate
          title={thread.title}
          backHref="/discussions"
          backLabel="← Back to forum discussions"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <Link
        href="/discussions"
        className="inline-flex items-center gap-1 text-sm font-comic text-ink-muted hover:text-comic-red"
      >
        <ArrowLeft className="h-4 w-4" /> Forum discussions
      </Link>

      <article className="comic-panel p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="comic">{thread.category}</Badge>
          <ContentRatingBadge item={thread} />
          {thread.tags.map((tag) => (
            <Badge key={tag} variant="tag">
              #{tag}
            </Badge>
          ))}
        </div>
        <h1 className="font-comic text-2xl md:text-3xl text-ink">{thread.title}</h1>
        <CommentAuthorRow
          username={thread.author_username}
          displayName={thread.author_display_name}
          meta={
            <>
              Thread starter · {formatWhen(thread.created_at)} · {thread.views} views
            </>
          }
        />
        <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{thread.body}</p>
      </article>

      <section className="comic-panel p-5 space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-dashed border-ink pb-3">
          <MessageCircle className="h-5 w-5 text-comic-red" />
          <h2 className="font-comic text-xl text-ink">
            Replies <span className="text-ink-muted">({replies.length})</span>
          </h2>
        </div>

        {replies.length === 0 ? (
          <p className="text-sm text-ink-muted italic text-center py-4">
            No replies yet — be the first to respond.
          </p>
        ) : (
          <ul className="space-y-4">
            {replies.map((reply) => (
              <li key={reply.id} className="border-l-4 border-comic-yellow pl-3 py-2">
                <CommentAuthorRow
                  username={reply.author_username}
                  displayName={reply.author_display_name}
                  meta={
                    <>
                      @{reply.author_username} · {formatWhen(reply.created_at)}
                    </>
                  }
                >
                  <p className="text-sm text-ink whitespace-pre-wrap mt-2">{reply.body}</p>
                </CommentAuthorRow>
              </li>
            ))}
          </ul>
        )}

        {!loading && isLoggedIn && identity ? (
          <form onSubmit={handleReply} className="space-y-3 pt-2 border-t border-dashed border-ink">
            <CommentAuthorRow
              username={identity.username}
              displayName={identity.displayName}
              avatarUrl={identity.profile?.avatar_url}
              meta="Your reply"
              size="xs"
            />
            <label className="font-comic text-sm text-ink block sr-only">Your reply</label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
              placeholder="Join the conversation…"
            />
            <Button type="submit" variant="comic" size="sm" disabled={!draft.trim()}>
              Post reply
            </Button>
          </form>
        ) : !loading ? (
          <LoginCTA message="Sign in to reply to this discussion." />
        ) : null}
      </section>
    </div>
  );
}
