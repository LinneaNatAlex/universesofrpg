"use client";

import { useEffect, useState } from "react";
import { getCommentCount, subscribeComments } from "@/lib/mock-comments";
import { getAllPosts, subscribePosts } from "@/lib/posts-store";
import type { FeedPost } from "@/types/database";

function enrich(posts: FeedPost[]): FeedPost[] {
  return posts
    .filter((p) => p.moderation_status === "approved")
    .map((p) => ({ ...p, comment_count: getCommentCount(p.id) }));
}

function sortByNewest(posts: FeedPost[]): FeedPost[] {
  return [...posts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function useFeedPosts(limit?: number): { posts: FeedPost[]; ready: boolean } {
  const [ready, setReady] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    const refresh = () => {
      const enriched = sortByNewest(enrich(getAllPosts()));
      setPosts(limit !== undefined ? enriched.slice(0, limit) : enriched);
    };
    refresh();
    setReady(true);
    const unsubPosts = subscribePosts(refresh);
    const unsubComments = subscribeComments(refresh);
    return () => {
      unsubPosts();
      unsubComments();
    };
  }, [limit]);

  return { posts, ready };
}
