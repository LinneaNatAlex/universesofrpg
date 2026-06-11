"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { FeedCard } from "@/components/feed/FeedCard";
import { Badge } from "@/components/ui/badge";
import type { PurchasedLibraryEntry } from "@/hooks/usePurchasedPosts";
import { getPostTags, postMatchesSearchQuery, postMatchesTagFilter } from "@/lib/post-tags";
import type { FeedPost } from "@/types/database";

interface ProfilePurchasesTabProps {
  entries: PurchasedLibraryEntry[];
  purchaseCount: number;
  loading?: boolean;
}

function entryMatchesSearch(entry: PurchasedLibraryEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (entry.post) {
    return (
      postMatchesSearchQuery(entry.post, query) ||
      entry.post.type.replace("_", " ").toLowerCase().includes(q) ||
      entry.post.author.username.toLowerCase().includes(q)
    );
  }
  return (
    entry.postId.toLowerCase().includes(q) ||
    entry.sellerUsername.toLowerCase().includes(q)
  );
}

function entryMatchesTag(entry: PurchasedLibraryEntry, tag: string | null): boolean {
  if (!tag || !entry.post) return !tag;
  return postMatchesTagFilter(entry.post, tag);
}

export function ProfilePurchasesTab({
  entries,
  purchaseCount,
  loading = false,
}: ProfilePurchasesTabProps) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const resolvedPosts = useMemo(
    () => entries.map((e) => e.post).filter((p): p is FeedPost => p !== null),
    [entries]
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const p of resolvedPosts) {
      getPostTags(p).forEach((t) => tags.add(t));
    }
    return [...tags].sort();
  }, [resolvedPosts]);

  const filtered = useMemo(() => {
    return entries.filter(
      (entry) => entryMatchesTag(entry, activeTag) && entryMatchesSearch(entry, query)
    );
  }, [entries, query, activeTag]);

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
          {filtered.length} of {purchaseCount} purchases
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((entry) =>
            entry.post ? (
              <FeedCard key={entry.postId} post={entry.post} />
            ) : (
              <Link
                key={entry.postId}
                href={`/post/${entry.postId}`}
                className="comic-panel p-5 block hover:bg-comic-yellow/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <ShoppingBag className="h-5 w-5 text-comic-red shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-comic text-ink">Purchased listing</p>
                    <p className="text-xs text-ink-muted mt-1">
                      {entry.sellerUsername
                        ? `by @${entry.sellerUsername}`
                        : "Open to load full details"}
                    </p>
                    {entry.purchasedAt && (
                      <p className="text-xs text-ink-muted mt-1">
                        {new Date(entry.purchasedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          )}
        </div>
      ) : (
        <div className="comic-panel p-6 text-center space-y-3">
          <p className="font-comic text-ink-muted">
            {purchaseCount === 0
              ? "No purchases yet."
              : "No purchases match your search or tag filter."}
          </p>
          {purchaseCount === 0 && (
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
