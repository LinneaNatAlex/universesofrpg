"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { Filter, ShoppingBag, Compass } from "lucide-react";
import { postHasCover } from "@/lib/post-cover";
import type { FeedPost } from "@/types/database";

const CATEGORY_FILTERS = ["All", "Fantasy", "Sci-fi", "Horror", "Anime"] as const;
type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

function isPaidListing(post: FeedPost): boolean {
  return post.pricing !== "free";
}

const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: low → high" },
  { id: "price-desc", label: "Price: high → low" },
  { id: "newest", label: "Newest" },
] as const;
type SortId = (typeof SORT_OPTIONS)[number]["id"];

function matchesCategory(post: FeedPost, filter: CategoryFilter): boolean {
  if (filter === "All") return true;
  const tag = filter.toLowerCase();
  const allTags = [...post.tags, ...post.style_tags].map((t) => t.toLowerCase());
  return allTags.some((t) => t === tag || t.includes(tag));
}

function sortPosts(posts: FeedPost[], sort: SortId): FeedPost[] {
  const copy = [...posts];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price_cents - b.price_cents);
    case "price-desc":
      return copy.sort((a, b) => b.price_cents - a.price_cents);
    case "newest":
      return copy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    default:
      return copy.sort((a, b) => b.like_count - a.like_count);
  }
}

export default function MarketplacePage() {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("All");
  const [sort, setSort] = useState<SortId>("featured");

  const { posts: allPosts } = useFeedPosts();
  const paidPosts = useMemo(
    () => allPosts.filter((p) => isPaidListing(p) && postHasCover(p)),
    [allPosts]
  );
  const freeCount = allPosts.length - paidPosts.length;

  const items = useMemo(() => {
    const filtered = paidPosts.filter((post) => matchesCategory(post, activeFilter));
    return sortPosts(filtered, sort);
  }, [paidPosts, activeFilter, sort]);

  return (
    <div className="space-y-6">
      <section className="comic-hero p-6">
        <div className="flex items-start gap-3">
          <ShoppingBag className="h-8 w-8 shrink-0 opacity-90" />
          <div>
            <h1 className="font-comic text-3xl">RPG Shop</h1>
            <p className="text-sm opacity-90 mt-1 max-w-lg">
              Premium RPG content — character packs, themes, story arcs, and asset bundles.
              Every listing needs a cover image. Free works live in Explore, not here.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm font-comic">
          <span>{paidPosts.length} premium listings</span>
          {freeCount > 0 && (
            <>
              <span>·</span>
              <Link href="/explore" className="underline hover:text-comic-yellow">
                {freeCount} free works in Explore →
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="comic-panel px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-ink-muted">
          Looking to browse free works?{" "}
          <Link href="/explore" className="font-comic text-comic-red hover:underline inline-flex items-center gap-1">
            <Compass className="h-3.5 w-3.5" />
            Go to Explore
          </Link>
        </span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortId)}
          className="border-2 border-ink bg-surface font-comic text-xs px-2 py-1"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-ink-muted shrink-0" />
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFilter(f)}
            className={`font-comic text-xs px-3 py-1.5 border-2 border-ink cursor-pointer transition-colors ${
              activeFilter === f
                ? "bg-comic-red text-white shadow-[2px_2px_0_#1a1a2e]"
                : "bg-surface text-ink hover:bg-comic-yellow"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center font-comic text-ink-muted py-12 comic-panel space-y-2">
          <p>
            {activeFilter === "All"
              ? "No premium listings yet."
              : `No premium listings in "${activeFilter}".`}
          </p>
          <p className="text-sm">
            Browse free creations in{" "}
            <Link href="/explore" className="text-comic-red hover:underline">
              Explore
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((post) => (
            <MarketplaceCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
