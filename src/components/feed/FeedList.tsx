"use client";

import Link from "next/link";
import { FeedCard } from "@/components/feed/FeedCard";
import { useFeedPosts } from "@/hooks/useFeedPosts";

const HOME_FEED_LIMIT = 10;

interface FeedListProps {
  /** Max posts to show — home page uses 10 latest */
  limit?: number;
}

function FeedListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="comic-card animate-pulse">
          <div className="comic-card-inner p-4 md:p-5 space-y-4">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-ink/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-ink/10 rounded" />
                <div className="h-3 w-20 bg-ink/10 rounded" />
              </div>
            </div>
            <div className="h-6 w-3/4 bg-ink/10 rounded" />
            <div className="h-24 bg-ink/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeedList({ limit = HOME_FEED_LIMIT }: FeedListProps) {
  const { posts, ready } = useFeedPosts(limit);

  return (
    <div className="space-y-4">
      {!ready ? (
        <FeedListSkeleton count={Math.min(limit, 4)} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {posts.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
        </div>
      )}
      {ready && posts.length === 0 && (
        <p className="text-center font-comic text-ink-muted py-8 comic-panel">
          No published posts yet.
        </p>
      )}
      {ready && posts.length > 0 && (
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
