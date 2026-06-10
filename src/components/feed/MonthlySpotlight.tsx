"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Code2,
  Heart,
  MessageCircle,
  Sparkles,
  UserCircle,
  ImageIcon,
  PenLine,
  Eye,
} from "lucide-react";
import { LayoutPreview } from "@/components/content/LayoutPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssetTeaserPreview } from "@/components/content/AssetTeaserPreview";
import { useAuth } from "@/hooks/useAuth";
import { useCommentCount } from "@/hooks/useCommentCount";
import { useMonthlySpotlight } from "@/hooks/useMonthlySpotlight";
import {
  formatSpotlightMonth,
  SPOTLIGHT_TYPE_HINTS,
  type SpotlightPick,
} from "@/lib/featured";
import type { FeedPost } from "@/types/database";

const TYPE_ICONS = {
  character_sheet: UserCircle,
  code_template: Code2,
  story_segment: BookOpen,
  digital_asset: ImageIcon,
  collab_thread: MessageCircle,
  text_writing: PenLine,
};

const ROTATE_MS = 6000;

function SpotlightVisual({ post }: { post: FeedPost }) {
  const { isLoggedIn } = useAuth();
  const coverUrl = post.book_cover_url;
  const assetUrl = post.type === "digital_asset" ? post.preview_image_url : null;

  if (assetUrl) {
    return (
      <div className="w-[160px] shrink-0 mx-auto md:mx-0">
        <AssetTeaserPreview
          src={assetUrl}
          alt={post.title}
          fullAccess={isLoggedIn}
          compact
          className="!h-[224px]"
        />
      </div>
    );
  }

  if (coverUrl) {
    return (
      <div className="comic-cover mx-auto md:mx-0 shrink-0">
        <Image
          src={coverUrl}
          alt=""
          width={160}
          height={224}
          className="object-cover w-[160px] h-[224px]"
          unoptimized
        />
      </div>
    );
  }

  if (post.type === "code_template" && post.html_code && post.css_code) {
    return (
      <div className="w-full max-w-[200px] shrink-0 min-w-0 mx-auto md:mx-0">
        <LayoutPreview
          html={post.html_code}
          css={post.css_code}
          js={post.js_code}
          height={176}
        />
      </div>
    );
  }

  const Icon = TYPE_ICONS[post.type];
  return (
    <div className="w-[160px] h-[224px] shrink-0 border-[3px] border-ink bg-comic-yellow/40 flex flex-col items-center justify-center gap-2 mx-auto md:mx-0">
      <Icon className="h-12 w-12 text-comic-red opacity-70" />
      <span className="font-comic text-xs text-ink-muted uppercase px-2 text-center">
        {SPOTLIGHT_TYPE_HINTS[post.type] ?? post.type}
      </span>
    </div>
  );
}

function SpotlightSlide({ pick }: { pick: SpotlightPick }) {
  const { isLoggedIn } = useAuth();
  const { post, category } = pick;
  const commentCount = useCommentCount(post.id);
  const synopsis = post.plot_synopsis ?? post.description ?? "";

  return (
    <div className="flex flex-col md:flex-row gap-5 md:gap-8 items-center md:items-start px-12 py-5 md:px-14 md:py-6">
      <SpotlightVisual post={post} />

      <div className="flex-1 min-w-0 text-center md:text-left">
        <Badge variant="comic" className="mb-2">
          {category.label}
        </Badge>
        <p className="text-xs font-comic text-ink-muted uppercase tracking-wide">
          {category.subtitle}
        </p>

        <Link href={`/post/${post.id}`} className="block group mt-2">
          <h3 className="font-comic text-2xl md:text-3xl text-ink group-hover:text-comic-red leading-tight">
            {post.title}
          </h3>
        </Link>

        <p className="text-sm text-ink-muted mt-1">
          by{" "}
          <Link
            href={`/profile/${post.author.username}`}
            className="font-comic text-comic-red hover:underline"
          >
            {post.author.display_name}
          </Link>
        </p>

        <p className="text-sm text-ink-muted italic mt-3 line-clamp-3 max-w-lg">
          {synopsis}
        </p>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-sm font-comic text-ink-muted">
          {isLoggedIn && (
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-comic-red" />
              {post.like_count}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {commentCount}
          </span>
          {post.pricing !== "free" ? (
            <Badge variant="paid" className="text-[10px]">
              Premium · sign up to preview
            </Badge>
          ) : (
            <Badge variant="free" className="text-[10px]">
              Free · sign up to read
            </Badge>
          )}
        </div>

        <Link href={`/post/${post.id}`} className="inline-block mt-5">
          <Button variant="comic" size="sm">
            <Eye className="h-4 w-4 mr-1.5" />
            View this pick
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function MonthlySpotlight() {
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
      className="comic-card overflow-hidden"
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
