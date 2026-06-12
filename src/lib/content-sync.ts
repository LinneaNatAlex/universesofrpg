"use client";

import { writeJson } from "@/lib/browser-storage";
import { mergeRpgForumList } from "@/lib/forums-platform-merge";
import { migrateFeedPost } from "@/lib/persona-rename";
import type { CommentsPlatformState } from "@/app/api/content/comments/route";
import type { DiscussionsPlatformState } from "@/app/api/content/discussions/route";
import type { PostsPlatformState } from "@/app/api/content/posts/route";
import type { ForumsPlatformState } from "@/app/api/content/forums/route";
import { createClient } from "@/lib/supabase/client";
import type { Comment, DiscussionReply, DiscussionThread, FeedPost, RpgForum } from "@/types/database";

const POSTS_KEY = "uorpg-posts-state";
const FORUMS_KEY = "uorpg-forums-state";
const COMMENTS_KEY = "uorpg-comments-state";
const DISCUSSIONS_KEY = "uorpg-discussions-state";

export const CONTENT_SYNCED_EVENT = "uorpg-content-synced";
export const CONTENT_SYNC_FAILED_EVENT = "uorpg-content-sync-failed";

let contentSyncSettled = false;

/** True after the first ContentHydrator run finishes (success or failure). */
export function isContentSyncSettled(): boolean {
  return contentSyncSettled;
}

export function markContentSyncSettled(): void {
  contentSyncSettled = true;
}

export type ContentSyncTarget = "posts" | "forums" | "comments" | "discussions";

export type ContentSyncFailure = {
  target: ContentSyncTarget;
  status: number;
  error: string;
};

let postsPushTimer: ReturnType<typeof setTimeout> | null = null;
let forumsPushTimer: ReturnType<typeof setTimeout> | null = null;
let commentsPushTimer: ReturnType<typeof setTimeout> | null = null;
let discussionsPushTimer: ReturnType<typeof setTimeout> | null = null;
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

type PlatformState =
  | PostsPlatformState
  | ForumsPlatformState
  | CommentsPlatformState
  | DiscussionsPlatformState;

async function pushPlatformState(
  target: ContentSyncTarget,
  state: PlatformState
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

export async function fetchCommentsPlatformState(): Promise<CommentsPlatformState | null> {
  try {
    const res = await fetch("/api/content/comments", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as CommentsPlatformState;
  } catch {
    return null;
  }
}

export async function fetchDiscussionsPlatformState(): Promise<DiscussionsPlatformState | null> {
  try {
    const res = await fetch("/api/content/discussions", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as DiscussionsPlatformState;
  } catch {
    return null;
  }
}

export function mergePostsState(
  local: PostsPlatformState,
  remote: PostsPlatformState
): PostsPlatformState {
  const deletedCustomIds = mergeStringLists(
    local.deletedCustomIds ?? [],
    remote.deletedCustomIds ?? []
  );
  const deletedCustomSet = new Set(deletedCustomIds);

  return {
    custom: mergeById(local.custom ?? [], remote.custom ?? [])
      .filter((post) => !deletedCustomSet.has(post.id))
      .map((post) => migrateFeedPost(post as FeedPost)) as FeedPost[],
    deletedMockIds: mergeStringLists(
      local.deletedMockIds ?? [],
      remote.deletedMockIds ?? []
    ),
    deletedCustomIds,
    likeCounts: { ...(local.likeCounts ?? {}), ...(remote.likeCounts ?? {}) },
  };
}

export function mergeForumsState(
  local: ForumsPlatformState,
  remote: ForumsPlatformState
): ForumsPlatformState {
  const deletedCustomIds = mergeStringLists(
    local.deletedCustomIds ?? [],
    remote.deletedCustomIds ?? []
  );
  const deletedCustomSet = new Set(deletedCustomIds);

  return {
    custom: mergeRpgForumList(local.custom ?? [], remote.custom ?? []).filter(
      (forum) => !deletedCustomSet.has(forum.id)
    ),
    deletedMockIds: mergeStringLists(
      local.deletedMockIds ?? [],
      remote.deletedMockIds ?? []
    ),
    deletedCustomIds,
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

function discussionThreadRevisionTime(thread: DiscussionThread): number {
  const stamp = thread.last_activity_at ?? thread.created_at ?? 0;
  return new Date(stamp).getTime();
}

export function mergeCommentsState(
  local: CommentsPlatformState,
  remote: CommentsPlatformState
): CommentsPlatformState {
  return {
    custom: mergeById(local.custom ?? [], remote.custom ?? []) as Comment[],
    deletedMockIds: mergeStringLists(
      local.deletedMockIds ?? [],
      remote.deletedMockIds ?? []
    ),
  };
}

export function mergeDiscussionsState(
  local: DiscussionsPlatformState,
  remote: DiscussionsPlatformState
): DiscussionsPlatformState {
  const threadMap = new Map<string, DiscussionThread>();
  for (const thread of local.customThreads ?? []) threadMap.set(thread.id, thread);
  for (const thread of remote.customThreads ?? []) {
    const prev = threadMap.get(thread.id);
    if (!prev) {
      threadMap.set(thread.id, thread);
      continue;
    }
    threadMap.set(
      thread.id,
      discussionThreadRevisionTime(thread) >= discussionThreadRevisionTime(prev)
        ? thread
        : prev
    );
  }

  const deletedMockThreadIds = mergeStringLists(
    local.deletedMockThreadIds ?? [],
    remote.deletedMockThreadIds ?? []
  );
  const deleted = new Set(deletedMockThreadIds);

  return {
    customThreads: [...threadMap.values()].filter((thread) => !deleted.has(thread.id)),
    customReplies: mergeById(
      local.customReplies ?? [],
      remote.customReplies ?? []
    ) as DiscussionReply[],
    deletedMockThreadIds,
  };
}

export function pushCommentsPlatformState(state: CommentsPlatformState): Promise<boolean> {
  return new Promise((resolve) => {
    pushChain = pushChain.then(async () => {
      const ok = await pushPlatformState("comments", state);
      resolve(ok);
    });
  });
}

export function pushDiscussionsPlatformState(
  state: DiscussionsPlatformState
): Promise<boolean> {
  return new Promise((resolve) => {
    pushChain = pushChain.then(async () => {
      const ok = await pushPlatformState("discussions", state);
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

export function scheduleCommentsPlatformPush(state: CommentsPlatformState): void {
  if (typeof window === "undefined") return;
  if (commentsPushTimer) clearTimeout(commentsPushTimer);
  commentsPushTimer = setTimeout(() => {
    commentsPushTimer = null;
    void pushCommentsPlatformState(state);
  }, 400);
}

export function scheduleDiscussionsPlatformPush(state: DiscussionsPlatformState): void {
  if (typeof window === "undefined") return;
  if (discussionsPushTimer) clearTimeout(discussionsPushTimer);
  discussionsPushTimer = setTimeout(() => {
    discussionsPushTimer = null;
    void pushDiscussionsPlatformState(state);
  }, 400);
}

export function saveMergedPostsState(state: PostsPlatformState): void {
  writeJson(POSTS_KEY, state);
}

export function saveMergedForumsState(state: ForumsPlatformState): void {
  writeJson(FORUMS_KEY, state);
}

export function saveMergedCommentsState(state: CommentsPlatformState): void {
  writeJson(COMMENTS_KEY, state);
}

export function saveMergedDiscussionsState(state: DiscussionsPlatformState): void {
  writeJson(DISCUSSIONS_KEY, state);
}
