"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { FeedCard } from "@/components/feed/FeedCard";
import { Badge } from "@/components/ui/badge";
import { getPostTags, postMatchesSearchQuery, postMatchesTagFilter } from "@/lib/post-tags";
import type { FeedPost } from "@/types/database";

interface ProfilePurchasesTabProps {
  purchases: FeedPost[];
  loading?: boolean;
}

export function ProfilePurchasesTab({
  purchases,
  loading = false,
}: ProfilePurchasesTabProps) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const p of purchases) {
      getPostTags(p).forEach((t) => tags.add(t));
    }
    return [...tags].sort();
  }, [purchases]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return purchases.filter((p) => {
      const matchesTag = postMatchesTagFilter(p, activeTag);
      const matchesQuery =
        !q ||
        postMatchesSearchQuery(p, query) ||
        p.type.replace("_", " ").toLowerCase().includes(q) ||
        p.author.username.toLowerCase().includes(q);
      return matchesTag && matchesQuery;
    });
  }, [purchases, query, activeTag]);

  if (loading) {
    return (
      <div className="comic-panel p-8 text-center font-comic text-ink-muted">
        Loading your library…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-comic text-ink-muted comic-panel px-3 py-2">
        <ShoppingBag className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
        Only you can see this tab — premium templates and Shop listings you have purchased.
      </p>

      <div className="comic-panel flex items-center gap-2 px-4 py-2">
        <Search className="h-4 w-4 text-ink-muted shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search purchases by title, creator, or tag…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
        />
        {(query || activeTag) && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveTag(null);
            }}
            className="text-xs font-comic text-comic-red hover:underline shrink-0"
          >
            Clear
          </button>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setQuery("");
                setActiveTag(activeTag === tag ? null : tag);
              }}
            >
              <Badge variant={activeTag === tag ? "comic" : "tag"}>{tag}</Badge>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs font-comic text-ink-muted">
          {filtered.length} of {purchases.length} purchases
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="comic-panel p-6 text-center space-y-3">
          <p className="font-comic text-ink-muted">
            {purchases.length === 0
              ? "No purchases yet."
              : "No purchases match your search or tag filter."}
          </p>
          {purchases.length === 0 && (
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1.5 font-comic text-sm text-comic-red hover:underline"
            >
              <ShoppingBag className="h-4 w-4" />
              Browse the Shop
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
