"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FeedCard } from "@/components/feed/FeedCard";
import { Badge } from "@/components/ui/badge";
import { getPostTags, postMatchesSearchQuery, postMatchesTagFilter } from "@/lib/post-tags";
import type { FeedPost } from "@/types/database";

interface ProfileCreationsTabProps {
  creations: FeedPost[];
  showPendingNote?: boolean;
}

export function ProfileCreationsTab({
  creations,
  showPendingNote = false,
}: ProfileCreationsTabProps) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const p of creations) {
      getPostTags(p).forEach((t) => tags.add(t));
    }
    return [...tags].sort();
  }, [creations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return creations.filter((p) => {
      const matchesTag = postMatchesTagFilter(p, activeTag);
      const matchesQuery =
        !q ||
        postMatchesSearchQuery(p, query) ||
        p.type.replace("_", " ").toLowerCase().includes(q);
      return matchesTag && matchesQuery;
    });
  }, [creations, query, activeTag]);

  return (
    <div className="space-y-4">
      {showPendingNote && (
        <p className="text-xs font-comic text-ink-muted comic-panel px-3 py-2">
          You also see pending works awaiting editor review — only you and editors can open them.
        </p>
      )}

      <div className="comic-panel flex items-center gap-2 px-4 py-2">
        <Search className="h-4 w-4 text-ink-muted shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects by title, type, or tag…"
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
          {filtered.length} of {creations.length} works
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="comic-panel p-6 text-center text-ink-muted font-comic">
          {creations.length === 0
            ? "No published creations yet."
            : "No works match your search or tag filter."}
        </p>
      )}
    </div>
  );
}
