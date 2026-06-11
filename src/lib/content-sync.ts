"use client";

import { writeJson } from "@/lib/browser-storage";
import type { PostsPlatformState } from "@/app/api/content/posts/route";
import type { ForumsPlatformState } from "@/app/api/content/forums/route";
import type { FeedPost } from "@/types/database";
import type { RpgForum } from "@/types/database";

const POSTS_KEY = "uorpg-posts-state";
const FORUMS_KEY = "uorpg-forums-state";

export const CONTENT_SYNCED_EVENT = "uorpg-content-synced";

function mergeById<T extends { id: string; created_at?: string }>(
  a: T[],
  b: T[]
): T[] {
  const map = new Map<string, T>();
  for (const item of a) map.set(item.id, item);
  for (const item of b) {
    const prev = map.get(item.id);
    if (!prev) {
      map.set(item.id, item);
      continue;
    }
    const prevTime = new Date(prev.created_at ?? 0).getTime();
    const nextTime = new Date(item.created_at ?? 0).getTime();
    map.set(item.id, nextTime >= prevTime ? item : prev);
  }
  return [...map.values()];
}

function mergeStringLists(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

export async function fetchPostsPlatformState(): Promise<PostsPlatformState | null> {
  try {
    const res = await fetch("/api/content/posts", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as PostsPlatformState;
  } catch {
    return null;
  }
}

export async function fetchForumsPlatformState(): Promise<ForumsPlatformState | null> {
  try {
    const res = await fetch("/api/content/forums", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ForumsPlatformState;
  } catch {
    return null;
  }
}

export function mergePostsState(
  local: PostsPlatformState,
  remote: PostsPlatformState
): PostsPlatformState {
  return {
    custom: mergeById(local.custom ?? [], remote.custom ?? []) as FeedPost[],
    deletedMockIds: mergeStringLists(
      local.deletedMockIds ?? [],
      remote.deletedMockIds ?? []
    ),
    likeCounts: { ...(local.likeCounts ?? {}), ...(remote.likeCounts ?? {}) },
  };
}

export function mergeForumsState(
  local: ForumsPlatformState,
  remote: ForumsPlatformState
): ForumsPlatformState {
  return {
    custom: mergeById(local.custom ?? [], remote.custom ?? []) as RpgForum[],
    deletedMockIds: mergeStringLists(
      local.deletedMockIds ?? [],
      remote.deletedMockIds ?? []
    ),
  };
}

export async function pushPostsPlatformState(state: PostsPlatformState): Promise<boolean> {
  try {
    const res = await fetch("/api/content/posts", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function pushForumsPlatformState(state: ForumsPlatformState): Promise<boolean> {
  try {
    const res = await fetch("/api/content/forums", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function saveMergedPostsState(state: PostsPlatformState): void {
  writeJson(POSTS_KEY, state);
}

export function saveMergedForumsState(state: ForumsPlatformState): void {
  writeJson(FORUMS_KEY, state);
}
