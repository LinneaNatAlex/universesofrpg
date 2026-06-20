"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, TrendingUp } from "lucide-react";
import { EXPLORE_TAGS } from "@/lib/mock-data";
import {
  collectTagsFromPosts,
  mergeTagLists,
  postMatchesSearchQuery,
  postMatchesTagFilter,
} from "@/lib/post-tags";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { ExploreCard } from "@/components/explore/ExploreCard";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { useAuth } from "@/hooks/useAuth";

export default function ExplorePage() {
  const { isLoggedIn } = useAuth();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { posts: allPosts } = useFeedPosts();

  const freeCatalog = useMemo(
    () => allPosts.filter((p) => p.pricing === "free"),
    [allPosts]
  );

  const browseTags = useMemo(
    () => mergeTagLists(EXPLORE_TAGS, collectTagsFromPosts(freeCatalog)),
    [freeCatalog]
  );

  const freePosts = useMemo(() => {
    return freeCatalog.filter(
      (p) => postMatchesTagFilter(p, activeTag) && postMatchesSearchQuery(p, query)
    );
  }, [freeCatalog, query, activeTag]);

  function handleTagClick(tag: string) {
    setQuery("");
    setActiveTag((current) => (current === tag ? null : tag));
  }

  const trendingCreators = useMemo(() => {
    const seen = new Set<string>();
    return allPosts
      .filter((p) => p.pricing === "free")
      .sort((a, b) => b.like_count - a.like_count)
      .filter((p) => {
        if (seen.has(p.author.username)) return false;
        seen.add(p.author.username);
        return true;
      })
      .slice(0, 4);
  }, [allPosts]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-comic text-2xl sm:text-3xl text-ink">Explore</h1>
        <p className="text-sm text-ink-muted mt-1 max-w-xl">
          Every <strong>free</strong> creation lives here. Browse and search at no cost — but you
          still need an account to read full chapters, view images, and download assets.
        </p>
        <p className="text-xs text-ink-muted mt-2">
          Paid content is in the{" "}
          <Link href="/marketplace" className="font-comic text-comic-red hover:underline inline-flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5" />
            Shop
          </Link>
          .
        </p>
      </section>

      <div className="comic-panel flex items-center gap-2 px-4 py-2">
        <Search className="h-4 w-4 text-ink-muted shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles, creators, or tags (#poem, rpg, letters…)"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
        />
      </div>

      {trendingCreators.length > 0 && !query && !activeTag && (
        <section>
          <h2 className="font-comic text-sm uppercase text-ink-muted flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-4 w-4" />
            Trending creators
          </h2>
          <div className="flex flex-wrap gap-2">
            {trendingCreators.map((post) => (
              <Link
                key={post.author.username}
                href={`/profile/${post.author.username}`}
                className="font-comic text-xs px-3 py-1.5 border-2 border-ink bg-comic-yellow hover:bg-comic-red hover:text-white transition-colors"
              >
                {post.author.display_name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-comic text-sm uppercase text-ink-muted mb-2">Browse by tag</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveTag(null);
            }}
            className={`font-comic text-xs px-3 py-1 border-2 border-ink ${
              !activeTag ? "bg-comic-red text-white" : "bg-surface hover:bg-comic-yellow"
            }`}
          >
            All
          </button>
          {browseTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className={`font-comic text-xs px-3 py-1 border-2 border-ink ${
                activeTag === tag ? "bg-comic-yellow" : "bg-surface hover:bg-comic-yellow/50"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-1 mb-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-comic text-base sm:text-lg text-ink">
            {freePosts.length} free {freePosts.length === 1 ? "work" : "works"}
            {activeTag && (
              <span className="text-sm text-ink-muted font-normal"> · #{activeTag}</span>
            )}
          </h2>
          <span className="text-xs font-comic text-ink-muted shrink-0">Teasers · sign up to read more</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {freePosts.map((post) => (
            <ExploreCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      {freePosts.length === 0 && (
        <p className="text-center text-ink-muted font-comic py-8 comic-panel">
          No free works match your search.
        </p>
      )}

      {!isLoggedIn && (
        <LoginCTA message="Create an account to read full stories, view images, and access the private forum." />
      )}
    </div>
  );
}
