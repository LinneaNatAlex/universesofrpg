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
  syncPurchasedPostIds,
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

  return {
    postIds: data.post_ids ?? [],
    purchases: Array.isArray(data.purchases) ? data.purchases : [],
    posts: Array.isArray(data.posts) ? data.posts : [],
  };
}

function mergeLibraries(
  libraries: Array<{
    postIds: string[];
    purchases: PlatformPurchase[];
    posts: FeedPost[];
  }>
): { postIds: string[]; purchases: PlatformPurchase[]; posts: FeedPost[] } {
  const postIds = new Set<string>();
  const purchases: PlatformPurchase[] = [];
  const posts: FeedPost[] = [];
  const seenPosts = new Set<string>();

  for (const lib of libraries) {
    for (const id of lib.postIds) postIds.add(id);
    for (const purchase of lib.purchases) {
      if (!purchases.some((p) => p.post_id === purchase.post_id)) {
        purchases.push(purchase);
      }
    }
    for (const post of lib.posts) {
      if (!seenPosts.has(post.id)) {
        seenPosts.add(post.id);
        posts.push(post);
      }
    }
  }

  return { postIds: [...postIds], purchases, posts };
}

async function fetchPurchasedLibrary(
  username: string,
  legacyUsername?: string | null
): Promise<{
  postIds: string[];
  purchases: PlatformPurchase[];
  posts: FeedPost[];
}> {
  await hydratePurchasesFromServer(username);
  if (legacyUsername && legacyUsername !== username) {
    await hydratePurchasesFromServer(legacyUsername);
  }

  try {
    const headers = await authFetchHeaders();
    const primary = await fetchPurchasesForUser(username, headers);
    const legacy =
      legacyUsername && legacyUsername !== username
        ? await fetchPurchasesForUser(legacyUsername, headers)
        : null;

    if (!primary && !legacy) {
      const postIds = [
        ...new Set([
          ...getPurchasedPostIds(username),
          ...(legacyUsername ? getPurchasedPostIds(legacyUsername) : []),
        ]),
      ];
      return { postIds, purchases: [], posts: mergePostSources(postIds, []) };
    }

    const merged = mergeLibraries([primary, legacy].filter(Boolean) as Array<{
      postIds: string[];
      purchases: PlatformPurchase[];
      posts: FeedPost[];
    }>);

    const localIds = [
      ...new Set([
        ...getPurchasedPostIds(username),
        ...(legacyUsername ? getPurchasedPostIds(legacyUsername) : []),
      ]),
    ];
    for (const id of localIds) {
      if (!merged.postIds.includes(id)) merged.postIds.push(id);
    }

    syncPurchasedPostIds(username, merged.postIds);

    return {
      postIds: merged.postIds,
      purchases: merged.purchases,
      posts: mergePostSources(merged.postIds, merged.posts),
    };
  } catch {
    const postIds = getPurchasedPostIds(username);
    return { postIds, purchases: [], posts: mergePostSources(postIds, []) };
  }
}

export function usePurchasedPosts(
  username: string | null,
  legacyUsername?: string | null
): {
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
      setPurchaseCount(library.postIds.length);
      setPosts(library.posts);
      setEntries(
        library.purchases.length > 0
          ? buildEntries(library.purchases, library.posts)
          : library.postIds.map((postId) => ({
              postId,
              post: library.posts.find((p) => p.id === postId) ?? null,
              sellerUsername: "",
              purchasedAt: "",
            }))
      );
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
      const library = await fetchPurchasedLibrary(username, legacyUsername);
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
  }, [username, legacyUsername]);

  return { posts, entries, purchaseCount, loading };
}
