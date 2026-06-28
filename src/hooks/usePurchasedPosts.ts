"use client";

import { useEffect, useState } from "react";
import { authFetchHeaders } from "@/lib/api-client-auth";
import { getCommentCount } from "@/lib/mock-comments";
import { getPostById } from "@/lib/posts";
import { subscribePosts } from "@/lib/posts-store";
import {
  getPurchasedPostIds,
  setServerPurchasedPostIds,
  subscribePurchases,
  hydratePurchasesFromServer,
} from "@/lib/purchases-store";
import type { PlatformPurchase } from "@/lib/marketplace-platform-store";
import type { FeedPost } from "@/types/database";

export interface PurchasedLibraryEntry {
  postId: string;
  post: FeedPost | null;
  sellerUsername: string;
  purchasedAt: string;
}

function enrich(post: FeedPost): FeedPost {
  return { ...post, comment_count: getCommentCount(post.id) };
}

function mergePostSources(
  postIds: string[],
  serverPosts: FeedPost[]
): FeedPost[] {
  const map = new Map<string, FeedPost>();

  for (const post of serverPosts) {
    if (post?.id && post.author) map.set(post.id, enrich(post));
  }

  for (const id of postIds) {
    if (map.has(id)) continue;
    const local = getPostById(id);
    if (local) map.set(id, enrich(local));
  }

  return [...map.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function buildEntries(
  purchases: PlatformPurchase[],
  posts: FeedPost[]
): PurchasedLibraryEntry[] {
  const postMap = new Map(posts.map((p) => [p.id, p]));

  return purchases.map((purchase) => ({
    postId: purchase.post_id,
    post: postMap.get(purchase.post_id) ?? null,
    sellerUsername: purchase.seller_username,
    purchasedAt: purchase.purchased_at,
  }));
}

function buildSyntheticPurchases(
  postIds: string[],
  serverPurchases: PlatformPurchase[],
  buyerUsername: string
): PlatformPurchase[] {
  const byPost = new Map(serverPurchases.map((p) => [p.post_id, p]));

  return postIds.map((id) => {
    const existing = byPost.get(id);
    if (existing) return existing;

    const post = getPostById(id);
    return {
      buyer_username: buyerUsername,
      post_id: id,
      seller_username: post?.author.username ?? "",
      amount_cents: 0,
      platform_fee_cents: 0,
      stripe_checkout_session_id: null,
      stripe_payment_intent_id: null,
      purchased_at: new Date(0).toISOString(),
    };
  });
}

function mergeLibraryWithLocal(
  username: string,
  server: {
    postIds: string[];
    purchases: PlatformPurchase[];
    posts: FeedPost[];
  } | null
): {
  postIds: string[];
  purchases: PlatformPurchase[];
  posts: FeedPost[];
} {
  const key = username.toLowerCase();
  const localIds = getPurchasedPostIds(key);

  if (!server) {
    const purchases = buildSyntheticPurchases(localIds, [], key);
    return {
      postIds: localIds,
      purchases,
      posts: mergePostSources(localIds, []),
    };
  }

  if (server.postIds.length > 0 || server.purchases.length > 0) {
    setServerPurchasedPostIds(key, server.postIds);
    const purchases =
      server.purchases.length > 0
        ? server.purchases
        : buildSyntheticPurchases(server.postIds, [], key);
    return {
      postIds: server.postIds,
      purchases,
      posts: mergePostSources(server.postIds, server.posts),
    };
  }

  if (localIds.length > 0) {
    const purchases = buildSyntheticPurchases(localIds, server.purchases, key);
    return {
      postIds: localIds,
      purchases,
      posts: mergePostSources(localIds, server.posts),
    };
  }

  setServerPurchasedPostIds(key, []);
  return { postIds: [], purchases: [], posts: [] };
}

async function fetchPurchasesForUser(
  username: string,
  headers: Record<string, string>
): Promise<{
  postIds: string[];
  purchases: PlatformPurchase[];
  posts: FeedPost[];
} | null> {
  const url = new URL("/api/marketplace/purchases", window.location.origin);
  url.searchParams.set("acting_username", username);
  const res = await fetch(url.toString(), {
    credentials: "include",
    headers,
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    post_ids?: string[];
    purchases?: PlatformPurchase[];
    posts?: FeedPost[];
  };

  const postIds = data.post_ids ?? [];
  const purchases = Array.isArray(data.purchases) ? data.purchases : [];
  const posts = Array.isArray(data.posts) ? data.posts : [];

  return { postIds, purchases, posts };
}

/** Server is source of truth when it returns rows; otherwise keep this profile's local checkout cache. */
async function fetchPurchasedLibrary(username: string): Promise<{
  postIds: string[];
  purchases: PlatformPurchase[];
  posts: FeedPost[];
}> {
  await hydratePurchasesFromServer(username);

  try {
    const headers = await authFetchHeaders();
    const library = await fetchPurchasesForUser(username, headers);
    return mergeLibraryWithLocal(username, library);
  } catch {
    return mergeLibraryWithLocal(username, null);
  }
}

export function usePurchasedPosts(username: string | null): {
  posts: FeedPost[];
  entries: PurchasedLibraryEntry[];
  purchaseCount: number;
  loading: boolean;
} {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [entries, setEntries] = useState<PurchasedLibraryEntry[]>([]);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(username));

  useEffect(() => {
    if (!username) {
      setPosts([]);
      setEntries([]);
      setPurchaseCount(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let currentIds: string[] = [];

    const applyLibrary = (library: {
      postIds: string[];
      purchases: PlatformPurchase[];
      posts: FeedPost[];
    }) => {
      if (cancelled) return;
      currentIds = library.postIds;
      const nextEntries = buildEntries(library.purchases, library.posts);
      setPurchaseCount(nextEntries.length);
      setPosts(library.posts);
      setEntries(nextEntries);
    };

    const refreshLocalPosts = () => {
      if (cancelled || currentIds.length === 0) return;
      const merged = mergePostSources(currentIds, []);
      setPosts(merged);
      setEntries((prev) =>
        prev.map((entry) => ({
          ...entry,
          post: merged.find((p) => p.id === entry.postId) ?? entry.post,
        }))
      );
    };

    const refreshIds = async () => {
      setLoading(true);
      const library = await fetchPurchasedLibrary(username);
      applyLibrary(library);
      setLoading(false);
    };

    void refreshIds();
    const unsubPurchases = subscribePurchases(() => {
      void refreshIds();
    });
    const unsubPosts = subscribePosts(refreshLocalPosts);

    return () => {
      cancelled = true;
      unsubPurchases();
      unsubPosts();
    };
  }, [username]);

  return { posts, entries, purchaseCount, loading };
}
