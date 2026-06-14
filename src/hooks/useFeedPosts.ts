"use client";

import { useEffect, useState } from "react";
import { CONTENT_SYNCED_EVENT, isContentSyncSettled } from "@/lib/content-sync";
import { isPublicFeedPost } from "@/lib/moderation";
import { isVisibleInPublicCatalog, type ContentViewerContext } from "@/lib/content-rating";
import { useContentViewer } from "@/hooks/useContentViewer";
import { getCommentCount, subscribeComments } from "@/lib/mock-comments";
import { getAllPosts, subscribePosts } from "@/lib/posts-store";
import type { FeedPost } from "@/types/database";

const SYNC_FALLBACK_MS = 4_000;

function enrich(posts: FeedPost[], viewerCtx: ContentViewerContext): FeedPost[] {
  return posts
    .filter(isPublicFeedPost)
    .filter((p) => isVisibleInPublicCatalog(p, viewerCtx))
    .map((p) => ({ ...p, comment_count: getCommentCount(p.id) }));
}

function sortByNewest(posts: FeedPost[]): FeedPost[] {
  return [...posts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function hasCachedPosts(): boolean {
  if (typeof window === "undefined") return false;
  return getAllPosts().length > 0;
}

export function useFeedPosts(limit?: number): { posts: FeedPost[]; ready: boolean } {
  const { ctx } = useContentViewer();
  const [ready, setReady] = useState(
    () => hasCachedPosts() || isContentSyncSettled()
  );
  const [posts, setPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    const refresh = () => {
      const enriched = sortByNewest(enrich(getAllPosts(), ctx));
      setPosts(limit !== undefined ? enriched.slice(0, limit) : enriched);
      if (enriched.length > 0) setReady(true);
    };

    const markReady = () => {
      refresh();
      setReady(true);
    };

    refresh();
    if (isContentSyncSettled() || hasCachedPosts()) {
      setReady(true);
    }

    const onSynced = () => markReady();
    window.addEventListener(CONTENT_SYNCED_EVENT, onSynced);
    const unsubPosts = subscribePosts(refresh);
    const unsubComments = subscribeComments(refresh);
    const timeout = window.setTimeout(() => setReady(true), SYNC_FALLBACK_MS);

    return () => {
      window.removeEventListener(CONTENT_SYNCED_EVENT, onSynced);
      unsubPosts();
      unsubComments();
      window.clearTimeout(timeout);
    };
  }, [limit, ctx]);

  return { posts, ready };
}
