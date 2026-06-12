"use client";

import { useEffect, useState } from "react";
import { CONTENT_SYNCED_EVENT, isContentSyncSettled } from "@/lib/content-sync";
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
  const [ready, setReady] = useState(() => isContentSyncSettled());
  const [posts, setPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    const refresh = () => {
      const enriched = sortByNewest(enrich(getAllPosts()));
      setPosts(limit !== undefined ? enriched.slice(0, limit) : enriched);
    };

    const markReady = () => {
      refresh();
      setReady(true);
    };

    refresh();
    if (isContentSyncSettled()) {
      setReady(true);
    }

    const onSynced = () => markReady();
    window.addEventListener(CONTENT_SYNCED_EVENT, onSynced);
    const unsubPosts = subscribePosts(refresh);
    const unsubComments = subscribeComments(refresh);
    const timeout = window.setTimeout(() => setReady(true), 12_000);

    return () => {
      window.removeEventListener(CONTENT_SYNCED_EVENT, onSynced);
      unsubPosts();
      unsubComments();
      window.clearTimeout(timeout);
    };
  }, [limit]);

  return { posts, ready };
}
