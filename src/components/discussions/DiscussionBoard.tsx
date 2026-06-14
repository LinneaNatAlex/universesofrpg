"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame, MessageSquarePlus, Search, TrendingUp } from "lucide-react";
import { useDiscussions } from "@/hooks/useDiscussions";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DISCUSSION_CATEGORIES,
  discussionMatchesSearch,
  discussionPopularityScore,
  getDiscussionTags,
} from "@/lib/discussion-tags";
import { collectDiscussionTags } from "@/lib/discussions-store";
import { isVisibleInPublicCatalog } from "@/lib/content-rating";
import { useContentViewer } from "@/hooks/useContentViewer";
import { cn } from "@/lib/utils";

const DISCUSSIONS_PAGE_SIZE = 15;

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function DiscussionBoard() {
  const { isLoggedIn } = useAuth();
  const { ctx: viewerCtx } = useContentViewer();
  const threads = useDiscussions();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const browseTags = useMemo(() => collectDiscussionTags(threads), [threads]);

  useEffect(() => {
    setPage(1);
  }, [query, activeCategory, activeTag]);

  const filtered = useMemo(() => {
    return threads
      .filter((t) => isVisibleInPublicCatalog(t, viewerCtx))
      .filter((t) => {
        if (activeCategory && t.category !== activeCategory) return false;
        if (activeTag && !getDiscussionTags(t).includes(activeTag)) return false;
        return discussionMatchesSearch(t, query);
      })
      .sort((a, b) => discussionPopularityScore(b) - discussionPopularityScore(a));
  }, [threads, query, activeCategory, activeTag, viewerCtx]);

  const popular = filtered.slice(0, 3);
  const totalPages = Math.max(1, Math.ceil(filtered.length / DISCUSSIONS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * DISCUSSIONS_PAGE_SIZE;
  const paginated = filtered.slice(pageStart, pageStart + DISCUSSIONS_PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + DISCUSSIONS_PAGE_SIZE, filtered.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [safePage]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-comic text-3xl text-ink">Forum discussions</h1>
          <p className="text-sm text-ink-muted mt-1 max-w-2xl">
            Community chat — ask questions, share tips, and talk shop. Everyone can read;
            sign in to start threads and reply. (This is separate from{" "}
            <Link href="/forum" className="text-comic-red font-comic hover:underline">
              RPG Topics
            </Link>
            , our play-by-post stories.)
          </p>
        </div>
        {isLoggedIn ? (
          <Link href="/discussions/new">
            <Button variant="comic" size="sm">
              <MessageSquarePlus className="h-4 w-4 mr-1.5" />
              New discussion
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button variant="comic-outline" size="sm">
              Sign in to post
            </Button>
          </Link>
        )}
      </header>

      <div className="comic-panel flex items-center gap-2 px-4 py-2">
        <Search className="h-4 w-4 text-ink-muted shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search discussions, authors, categories, or tags…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
        />
      </div>

      <section className="space-y-2">
        <p className="font-comic text-xs uppercase text-ink-muted">Categories</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={cn(
              "font-comic text-xs px-3 py-1.5 border-2 border-ink transition-colors",
              !activeCategory ? "bg-comic-red text-white" : "bg-surface hover:bg-comic-yellow"
            )}
          >
            All
          </button>
          {DISCUSSION_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() =>
                setActiveCategory((c) => (c === cat ? null : cat))
              }
              className={cn(
                "font-comic text-xs px-3 py-1.5 border-2 border-ink transition-colors",
                activeCategory === cat
                  ? "bg-comic-red text-white"
                  : "bg-surface hover:bg-comic-yellow"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {browseTags.length > 0 && (
        <section className="space-y-2">
          <p className="font-comic text-xs uppercase text-ink-muted">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {browseTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag((t) => (t === tag ? null : tag))}
                className={cn(
                  "text-[11px] font-comic px-2 py-1 border border-ink transition-colors",
                  activeTag === tag
                    ? "bg-comic-yellow text-ink"
                    : "bg-surface text-ink-muted hover:text-ink"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {popular.length > 0 && !query && !activeCategory && !activeTag && (
        <section className="space-y-2">
          <h2 className="font-comic text-sm uppercase text-ink-muted flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            Most popular
          </h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {popular.map((thread) => (
              <Link
                key={thread.id}
                href={`/discussions/${thread.id}`}
                className="comic-panel p-3 hover:bg-comic-yellow/30 transition-colors block"
              >
                <p className="font-comic text-sm text-ink line-clamp-2">{thread.title}</p>
                <p className="text-[11px] text-ink-muted mt-1 flex items-center gap-1">
                  <Flame className="h-3 w-3 text-comic-red" />
                  {thread.reply_count} replies · {thread.views} views
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-comic text-lg text-ink">
            {filtered.length} discussion{filtered.length === 1 ? "" : "s"}
          </h2>
          {filtered.length > DISCUSSIONS_PAGE_SIZE && (
            <p className="text-xs text-ink-muted font-comic">
              Showing {rangeStart}–{rangeEnd} · page {safePage} of {totalPages}
            </p>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="comic-panel p-8 text-center text-sm text-ink-muted italic">
            No discussions match your filters.
          </div>
        ) : (
          paginated.map((thread) => (
            <Link
              key={thread.id}
              href={`/discussions/${thread.id}`}
              className="comic-card block p-4 hover:no-underline group"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-comic text-lg text-ink group-hover:text-comic-red leading-tight flex-1 min-w-0">
                  {thread.title}
                </h3>
                <span className="text-[11px] font-comic text-ink-muted shrink-0">
                  {thread.reply_count} replies
                </span>
              </div>
              <p className="text-sm text-ink-muted mt-2 line-clamp-2">{thread.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                <UserAvatar
                  username={thread.author_username}
                  displayName={thread.author_display_name}
                  size="xs"
                />
                <span className="font-comic text-comic-red">
                  {thread.author_display_name}
                </span>
                <span className="text-ink-muted">@{thread.author_username}</span>
                <span>·</span>
                <span>{formatWhen(thread.last_activity_at)}</span>
                <span>·</span>
                <span>{thread.views} views</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="comic" className="text-[10px]">
                  {thread.category}
                </Badge>
                {thread.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="tag" className="text-[10px]">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </Link>
          ))
        )}

        {filtered.length > DISCUSSIONS_PAGE_SIZE && (
          <nav
            className="flex flex-wrap items-center justify-center gap-2 pt-2"
            aria-label="Discussion pages"
          >
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-0.5" />
              Previous
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={cn(
                    "min-w-[2.25rem] h-8 px-2 font-comic text-xs border-2 border-ink transition-colors",
                    n === safePage
                      ? "bg-comic-red text-white"
                      : "bg-surface hover:bg-comic-yellow text-ink"
                  )}
                  aria-current={n === safePage ? "page" : undefined}
                >
                  {n}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-0.5" />
            </Button>
          </nav>
        )}
      </section>
    </div>
  );
}
