"use client";

import Link from "next/link";
import { FeedCard } from "@/components/feed/FeedCard";
import { useFeedPosts } from "@/hooks/useFeedPosts";

const HOME_FEED_LIMIT = 10;

interface FeedListProps {
  /** Max posts to show — home page uses 10 latest */
  limit?: number;
}

export function FeedList({ limit = HOME_FEED_LIMIT }: FeedListProps) {
  const posts = useFeedPosts(limit);

  return (
    <div className="space-y-4">
      <div className="grid gap-5 md:grid-cols-2">
        {posts.map((post) => (
          <FeedCard key={post.id} post={post} />
        ))}
      </div>
      {posts.length === 0 && (
        <p className="text-center font-comic text-ink-muted py-8 comic-panel">
          No published posts yet.
        </p>
      )}
      {posts.length > 0 && (
        <p className="text-center text-sm text-ink-muted">
          {posts.length >= limit
            ? `Showing the ${limit} most recent posts.`
            : `Showing all ${posts.length} recent posts.`}{" "}
          <Link href="/explore" className="font-comic text-comic-red hover:underline">
            Explore free works →
          </Link>
          {" · "}
          <Link href="/marketplace" className="font-comic text-comic-red hover:underline">
            Shop premium →
          </Link>
        </p>
      )}
    </div>
  );
}
