"use client";

import { writeJson } from "@/lib/browser-storage";
import type { CommentsPlatformState } from "@/app/api/content/comments/route";
import type { HomepageChatPlatformState } from "@/app/api/content/homepage-chat/route";
import type { DiscussionsPlatformState } from "@/app/api/content/discussions/route";
import type { PostsPlatformState } from "@/app/api/content/posts/route";
import type { ForumsPlatformState } from "@/app/api/content/forums/route";
import { authHeadersForSync } from "@/lib/sync-auth";
import type { FeedPost } from "@/types/database";

export {
  mergeCommentsState,
  mergeDiscussionsState,
  mergeForumsState,
  mergeHomepageChatState,
  mergePostsState,
} from "@/lib/content-platform-merge";

const POSTS_KEY = "uorpg-posts-state";
const FORUMS_KEY = "uorpg-forums-state";
const COMMENTS_KEY = "uorpg-comments-state";
const DISCUSSIONS_KEY = "uorpg-discussions-state";
const HOMEPAGE_CHAT_KEY = "uorpg-homepage-chat-state";

export const CONTENT_SYNCED_EVENT = "uorpg-content-synced";

let contentSyncSettled = false;

/** True after the first ContentHydrator run finishes (success or failure). */
export function isContentSyncSettled(): boolean {
  return contentSyncSettled;
}

export function markContentSyncSettled(): void {
  contentSyncSettled = true;
}

export type ContentSyncTarget =
  | "posts"
  | "forums"
  | "comments"
  | "discussions"
  | "homepage-chat";

type PushOptions = {
  retries?: number;
};

let postsPushTimer: ReturnType<typeof setTimeout> | null = null;
let forumsPushTimer: ReturnType<typeof setTimeout> | null = null;
/** Avoid pushing an empty local snapshot before the first server pull finishes. */
let postsHydrationComplete = false;
let pendingPostsPush: PostsPlatformState | null = null;
const postsHydrationWaiters = new Set<(ready: boolean) => void>();

let forumsHydrationComplete = false;
let pendingForumsPush: ForumsPlatformState | null = null;
const forumsHydrationWaiters = new Set<(ready: boolean) => void>();

export function markPostsHydrationComplete(): void {
  postsHydrationComplete = true;
  for (const resolve of postsHydrationWaiters) {
    resolve(true);
  }
  postsHydrationWaiters.clear();
  if (pendingPostsPush) {
    const state = pendingPostsPush;
    pendingPostsPush = null;
    schedulePostsPlatformPush(state);
  }
}

export function waitForPostsHydration(maxMs = 10_000): Promise<boolean> {
  if (postsHydrationComplete) return Promise.resolve(true);
  return new Promise((resolve) => {
    const onReady = (ready: boolean) => {
      clearTimeout(timer);
      postsHydrationWaiters.delete(onReady);
      resolve(ready);
    };
    const timer = setTimeout(() => {
      postsHydrationWaiters.delete(onReady);
      resolve(postsHydrationComplete);
    }, maxMs);
    postsHydrationWaiters.add(onReady);
  });
}

export function markForumsHydrationComplete(): void {
  forumsHydrationComplete = true;
  for (const resolve of forumsHydrationWaiters) {
    resolve(true);
  }
  forumsHydrationWaiters.clear();
  if (pendingForumsPush) {
    const state = pendingForumsPush;
    pendingForumsPush = null;
    scheduleForumsPlatformPush(state);
  }
}

export function areForumsHydrationComplete(): boolean {
  return forumsHydrationComplete;
}

/** Wait until the first server pull finishes so we merge before pushing local edits. */
export function waitForForumsHydration(maxMs = 10_000): Promise<boolean> {
  if (forumsHydrationComplete) return Promise.resolve(true);
  return new Promise((resolve) => {
    const onReady = (ready: boolean) => {
      clearTimeout(timer);
      forumsHydrationWaiters.delete(onReady);
      resolve(ready);
    };
    const timer = setTimeout(() => {
      forumsHydrationWaiters.delete(onReady);
      resolve(forumsHydrationComplete);
    }, maxMs);
    forumsHydrationWaiters.add(onReady);
  });
}
let commentsPushTimer: ReturnType<typeof setTimeout> | null = null;
let discussionsPushTimer: ReturnType<typeof setTimeout> | null = null;
let homepageChatPushTimer: ReturnType<typeof setTimeout> | null = null;
let pushChain: Promise<void> = Promise.resolve();

async function fetchWithAuthRetry(
  url: string,
  init: RequestInit,
  retries = 3
): Promise<Response> {
  let lastRes: Response | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    const headers = await authHeadersForSync();
    const res = await fetch(url, {
      ...init,
      credentials: "include",
      headers: { ...headers, ...(init.headers as Record<string, string>) },
    });
    lastRes = res;
    if (res.ok) return res;
    if (res.status === 401 && attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      continue;
    }
    return res;
  }

  return lastRes!;
}

type PlatformState =
  | PostsPlatformState
  | ForumsPlatformState
  | CommentsPlatformState
  | DiscussionsPlatformState
  | HomepageChatPlatformState;

async function pushPlatformState(
  target: ContentSyncTarget,
  state: PlatformState,
  options: PushOptions = {}
): Promise<boolean> {
  const retries = options.retries ?? 3;

  try {
    const res = await fetchWithAuthRetry(
      `/api/content/${target}`,
      {
        method: "PUT",
        body: JSON.stringify(state),
      },
      retries
    );

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      console.warn(`[content-sync] ${target} failed:`, payload.error ?? res.status);
      return false;
    }

    return true;
  } catch (err) {
    console.warn(`[content-sync] ${target} failed:`, err);
    return false;
  }
}

export async function pushSinglePostToServer(
  post: FeedPost,
  options: PushOptions = {}
): Promise<boolean> {
  const retries = options.retries ?? 3;

  try {
    const res = await fetchWithAuthRetry(
      `/api/content/posts/${post.id}`,
      {
        method: "PUT",
        body: JSON.stringify(post),
      },
      retries
    );

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      console.warn("[content-sync] single post failed:", payload.error ?? res.status);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("[content-sync] single post failed:", err);
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

export async function fetchHomepageChatPlatformState(): Promise<HomepageChatPlatformState | null> {
  try {
    const res = await fetch("/api/content/homepage-chat", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as HomepageChatPlatformState;
  } catch {
    return null;
  }
}

export function pushPostsPlatformState(
  state: PostsPlatformState,
  options?: PushOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    pushChain = pushChain.then(async () => {
      const ok = await pushPlatformState("posts", state, options);
      resolve(ok);
    });
  });
}

export function pushForumsPlatformState(
  state: ForumsPlatformState,
  options?: PushOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    pushChain = pushChain.then(async () => {
      const ok = await pushPlatformState("forums", state, options);
      resolve(ok);
    });
  });
}

export function pushCommentsPlatformState(
  state: CommentsPlatformState,
  options?: PushOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    pushChain = pushChain.then(async () => {
      const ok = await pushPlatformState("comments", state, options);
      resolve(ok);
    });
  });
}

export function pushDiscussionsPlatformState(
  state: DiscussionsPlatformState,
  options?: PushOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    pushChain = pushChain.then(async () => {
      const ok = await pushPlatformState("discussions", state, options);
      resolve(ok);
    });
  });
}

export function pushHomepageChatPlatformState(
  state: HomepageChatPlatformState,
  options?: PushOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    pushChain = pushChain.then(async () => {
      const ok = await pushPlatformState("homepage-chat", state, options);
      resolve(ok);
    });
  });
}

/** Debounced live save after rapid local edits (likes, moderation, etc.). */
export function schedulePostsPlatformPush(state: PostsPlatformState): void {
  if (typeof window === "undefined") return;
  pendingPostsPush = state;
  if (!postsHydrationComplete) return;
  if (postsPushTimer) clearTimeout(postsPushTimer);
  postsPushTimer = setTimeout(() => {
    postsPushTimer = null;
    pendingPostsPush = null;
    void pushPostsPlatformState(state);
  }, 400);
}

export function scheduleForumsPlatformPush(state: ForumsPlatformState): void {
  if (typeof window === "undefined") return;
  pendingForumsPush = state;
  if (!forumsHydrationComplete) return;
  if (forumsPushTimer) clearTimeout(forumsPushTimer);
  forumsPushTimer = setTimeout(() => {
    forumsPushTimer = null;
    pendingForumsPush = null;
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

export function scheduleHomepageChatPlatformPush(state: HomepageChatPlatformState): void {
  if (typeof window === "undefined") return;
  if (homepageChatPushTimer) clearTimeout(homepageChatPushTimer);
  homepageChatPushTimer = setTimeout(() => {
    homepageChatPushTimer = null;
    void pushHomepageChatPlatformState(state);
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

export function saveMergedHomepageChatState(state: HomepageChatPlatformState): void {
  writeJson(HOMEPAGE_CHAT_KEY, state);
}
