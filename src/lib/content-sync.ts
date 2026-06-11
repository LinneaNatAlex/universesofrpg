"use client";

import { writeJson } from "@/lib/browser-storage";
import type { PostsPlatformState } from "@/app/api/content/posts/route";
import type { ForumsPlatformState } from "@/app/api/content/forums/route";
import { createClient } from "@/lib/supabase/client";
import type { FeedPost } from "@/types/database";
import type { RpgForum } from "@/types/database";

const POSTS_KEY = "uorpg-posts-state";
const FORUMS_KEY = "uorpg-forums-state";

export const CONTENT_SYNCED_EVENT = "uorpg-content-synced";
export const CONTENT_SYNC_FAILED_EVENT = "uorpg-content-sync-failed";

export type ContentSyncFailure = {
  target: "posts" | "forums";
  status: number;
  error: string;
};

let postsPushTimer: ReturnType<typeof setTimeout> | null = null;
let forumsPushTimer: ReturnType<typeof setTimeout> | null = null;
let pushChain: Promise<void> = Promise.resolve();

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // Cookie session may still work.
  }

  return headers;
}

function itemRevisionTime(item: {
  created_at?: string;
  updated_at?: string;
}): number {
  const stamp = item.updated_at ?? item.created_at ?? 0;
  return new Date(stamp).getTime();
}

function mergeById<
  T extends { id: string; created_at?: string; updated_at?: string },
>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of a) map.set(item.id, item);
  for (const item of b) {
    const prev = map.get(item.id);
    if (!prev) {
      map.set(item.id, item);
      continue;
    }
    map.set(
      item.id,
      itemRevisionTime(item) >= itemRevisionTime(prev) ? item : prev
    );
  }
  return [...map.values()];
}

function mergeStringLists(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

function dispatchSyncFailure(failure: ContentSyncFailure): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ContentSyncFailure>(CONTENT_SYNC_FAILED_EVENT, {
      detail: failure,
    })
  );
}

async function pushPlatformState(
  target: "posts" | "forums",
  state: PostsPlatformState | ForumsPlatformState
): Promise<boolean> {
  try {
    const headers = await authHeaders();
    const res = await fetch(`/api/content/${target}`, {
      method: "PUT",
      credentials: "include",
      headers,
      body: JSON.stringify(state),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      const error =
        payload.error ??
        (res.status === 401
          ? "Sign in required to save live."
          : `Could not save ${target} live (${res.status}).`);
      dispatchSyncFailure({ target, status: res.status, error });
      console.warn(`[content-sync] ${target} failed:`, error);
      return false;
    }

    return true;
  } catch (err) {
    const error = err instanceof Error ? err.message : "Network error";
    dispatchSyncFailure({ target, status: 0, error });
    console.warn(`[content-sync] ${target} failed:`, error);
    return false;
  }
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

export function pushPostsPlatformState(state: PostsPlatformState): Promise<boolean> {
  return new Promise((resolve) => {
    pushChain = pushChain.then(async () => {
      const ok = await pushPlatformState("posts", state);
      resolve(ok);
    });
  });
}

export function pushForumsPlatformState(state: ForumsPlatformState): Promise<boolean> {
  return new Promise((resolve) => {
    pushChain = pushChain.then(async () => {
      const ok = await pushPlatformState("forums", state);
      resolve(ok);
    });
  });
}

/** Debounced live save after rapid local edits (likes, moderation, etc.). */
export function schedulePostsPlatformPush(state: PostsPlatformState): void {
  if (typeof window === "undefined") return;
  if (postsPushTimer) clearTimeout(postsPushTimer);
  postsPushTimer = setTimeout(() => {
    postsPushTimer = null;
    void pushPostsPlatformState(state);
  }, 400);
}

export function scheduleForumsPlatformPush(state: ForumsPlatformState): void {
  if (typeof window === "undefined") return;
  if (forumsPushTimer) clearTimeout(forumsPushTimer);
  forumsPushTimer = setTimeout(() => {
    forumsPushTimer = null;
    void pushForumsPlatformState(state);
  }, 400);
}

export function saveMergedPostsState(state: PostsPlatformState): void {
  writeJson(POSTS_KEY, state);
}

export function saveMergedForumsState(state: ForumsPlatformState): void {
  writeJson(FORUMS_KEY, state);
}
