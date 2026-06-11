"use client";

import { useEffect, useState } from "react";
import { authFetchHeaders } from "@/lib/api-client-auth";
import { getCommentCount } from "@/lib/mock-comments";
import { getPostById } from "@/lib/posts";
import { subscribePosts } from "@/lib/posts-store";
import {
  getPurchasedPostIds,
  hydratePurchasesFromServer,
  subscribePurchases,
} from "@/lib/purchases-store";
import type { FeedPost } from "@/types/database";

function enrich(post: FeedPost): FeedPost {
  return { ...post, comment_count: getCommentCount(post.id) };
}

function resolvePurchasedPosts(postIds: string[]): FeedPost[] {
  const posts: FeedPost[] = [];
  for (const id of postIds) {
    const post = getPostById(id);
    if (post) posts.push(enrich(post));
  }
  return posts.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

async function fetchPurchasedPostIds(username: string): Promise<string[]> {
  await hydratePurchasesFromServer(username);

  try {
    const headers = await authFetchHeaders();
    const url = new URL("/api/marketplace/purchases", window.location.origin);
    url.searchParams.set("acting_username", username);
    const res = await fetch(url.toString(), {
      credentials: "include",
      headers,
      cache: "no-store",
    });
    if (!res.ok) return getPurchasedPostIds(username);

    const data = (await res.json()) as { post_ids?: string[] };
    return data.post_ids ?? getPurchasedPostIds(username);
  } catch {
    return getPurchasedPostIds(username);
  }
}

export function usePurchasedPosts(username: string | null): {
  posts: FeedPost[];
  loading: boolean;
} {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(Boolean(username));

  useEffect(() => {
    if (!username) {
      setPosts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let currentIds: string[] = [];

    const applyPosts = () => {
      if (!cancelled) setPosts(resolvePurchasedPosts(currentIds));
    };

    const refreshIds = async () => {
      setLoading(true);
      currentIds = await fetchPurchasedPostIds(username);
      if (cancelled) return;
      applyPosts();
      setLoading(false);
    };

    void refreshIds();
    const unsubPurchases = subscribePurchases(() => {
      void refreshIds();
    });
    const unsubPosts = subscribePosts(applyPosts);

    return () => {
      cancelled = true;
      unsubPurchases();
      unsubPosts();
    };
  }, [username]);

  return { posts, loading };
}
