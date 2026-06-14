"use client";

import { writeJson } from "@/lib/browser-storage";
import type { CommentsPlatformState } from "@/app/api/content/comments/route";
import type { DiscussionsPlatformState } from "@/app/api/content/discussions/route";
import type { PostsPlatformState } from "@/app/api/content/posts/route";
import type { ForumsPlatformState } from "@/app/api/content/forums/route";
import { createClient } from "@/lib/supabase/client";
import type { FeedPost } from "@/types/database";

export {
  mergeCommentsState,
  mergeDiscussionsState,
  mergeForumsState,
  mergePostsState,
} from "@/lib/content-platform-merge";

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

export async function pushSinglePostToServer(post: FeedPost): Promise<boolean> {
  try {
    const headers = await authHeaders();
    const res = await fetch(`/api/content/posts/${post.id}`, {
      method: "PUT",
      credentials: "include",
      headers,
      body: JSON.stringify(post),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      const error =
        payload.error ??
        (res.status === 401
          ? "Sign in required to save live."
          : `Could not save post live (${res.status}).`);
      dispatchSyncFailure({ target: "posts", status: res.status, error });
      console.warn("[content-sync] single post failed:", error);
      return false;
    }

    return true;
  } catch (err) {
    const error = err instanceof Error ? err.message : "Network error";
    dispatchSyncFailure({ target: "posts", status: 0, error });
    console.warn("[content-sync] single post failed:", error);
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
