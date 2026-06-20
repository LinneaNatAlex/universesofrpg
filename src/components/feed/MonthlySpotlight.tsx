"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageCircle, Sparkles, Eye } from "lucide-react";
import { PostDetailLink } from "@/components/content/PostDetailLink";
import { PostCoverThumbnail } from "@/components/content/PostCoverThumbnail";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/feed/LikeButton";
import { PurchaseCount } from "@/components/marketplace/PurchaseCount";
import { useCommentCount } from "@/hooks/useCommentCount";
import { useMonthlySpotlight } from "@/hooks/useMonthlySpotlight";
import { requiresCodePurchase } from "@/lib/posts";
import { formatSpotlightMonth, type SpotlightPick } from "@/lib/featured";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/types/database";

const ROTATE_MS = 6000;

function SpotlightVisual({ post }: { post: FeedPost }) {
  const coverOnly =
    post.type === "code_template" ||
    post.pricing !== "free" ||
    requiresCodePurchase(post);

  return (
    <PostCoverThumbnail
      post={post}
      size="feed"
      coverOnly={coverOnly}
      className="mx-auto md:mx-0 shrink-0"
    />
  );
}

function SpotlightSlide({ pick }: { pick: SpotlightPick }) {
  const { post, category } = pick;
  const { isLoggedIn } = useAuth();
  const commentCount = useCommentCount(post.id);
  const synopsis = post.plot_synopsis ?? post.description ?? "";

  return (
    <div className="flex flex-col md:flex-row gap-5 md:gap-7 items-center md:items-start px-4 sm:px-8 md:px-10 py-5 md:py-6">
      <SpotlightVisual post={post} />

      <div className="flex-1 min-w-0 w-full text-center md:text-left">
        <Badge variant="comic" className="mb-2">
          {category.label}
        </Badge>
        <p className="text-xs font-comic text-ink-muted uppercase tracking-wide">
          {category.subtitle}
        </p>

        <PostDetailLink post={post} className="block group mt-2">
          <h3 className="font-comic text-2xl md:text-3xl text-ink group-hover:text-comic-red leading-tight">
            {post.title}
          </h3>
        </PostDetailLink>

        <p className="text-sm text-ink-muted mt-1">
          by{" "}
          <Link
            href={`/profile/${post.author.username}`}
            className="font-comic text-comic-red hover:underline"
          >
            {post.author.display_name}
          </Link>
        </p>

        {synopsis ? (
          <p className="text-sm text-ink-muted italic mt-3 line-clamp-3 max-w-lg mx-auto md:mx-0">
            {synopsis}
          </p>
        ) : null}

        <div className="mt-5 pt-4 border-t-2 border-dashed border-ink/30 max-w-lg mx-auto md:mx-0">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm font-comic text-ink-muted">
            <LikeButton postId={post.id} initialCount={post.like_count} />
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {commentCount}
            </span>
            {post.pricing !== "free" && <PurchaseCount postId={post.id} />}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2">
            {post.pricing !== "free" ? (
              <Badge variant="paid" className="text-[10px]">
                Premium · sign up to preview
              </Badge>
            ) : (
              <Badge variant="free" className="text-[10px]">
                Free · sign up to read
              </Badge>
            )}
            <PostDetailLink post={post}>
              <Button variant="comic" size="sm">
                <Eye className="h-4 w-4 mr-1.5" />
                {post.type === "code_template" && !isLoggedIn
                  ? "Sign in to view"
                  : "View this pick"}
              </Button>
            </PostDetailLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MonthlySpotlight({ className }: { className?: string }) {
  const picks = useMonthlySpotlight();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = picks.length;
  const monthLabel = formatSpotlightMonth();

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => goTo(index + 1), ROTATE_MS);
    return () => clearInterval(timer);
  }, [count, paused, index, goTo]);

  if (count === 0) return null;

  const current = picks[index];

  return (
    <section
      className={cn("comic-card overflow-hidden", className)}
      aria-label={`Monthly spotlight, ${monthLabel}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="comic-panel-header px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <div>
            <h2 className="font-comic text-lg md:text-xl leading-none">
              Picks of the month
            </h2>
            <p className="text-xs opacity-80 mt-0.5">{monthLabel}</p>
          </div>
        </div>
        <span className="comic-burst text-[10px] md:text-xs">HOT!</span>
      </div>

      <div className="relative bg-surface">
        <SpotlightSlide pick={current} />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 border-2 border-ink bg-comic-yellow hover:bg-comic-red hover:text-white transition-colors flex items-center justify-center"
              aria-label="Previous pick"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 border-2 border-ink bg-comic-yellow hover:bg-comic-red hover:text-white transition-colors flex items-center justify-center"
              aria-label="Next pick"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 border-t-2 border-ink border-dashed bg-surface">
          {picks.map((pick, i) => (
            <button
              key={pick.category.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`font-comic text-xs px-3 py-1 border-2 border-ink transition-colors ${
                i === index
                  ? "bg-comic-red text-white"
                  : "bg-surface hover:bg-comic-yellow"
              }`}
              aria-label={`Show ${pick.category.label}`}
              aria-current={i === index ? "true" : undefined}
            >
              {pick.category.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
