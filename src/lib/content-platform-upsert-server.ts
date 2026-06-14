import type { CommentsPlatformState } from "@/app/api/content/comments/route";
import type { DiscussionsPlatformState } from "@/app/api/content/discussions/route";
import type { PostsPlatformState } from "@/app/api/content/posts/route";
import type { ForumsPlatformState } from "@/app/api/content/forums/route";
import { sanitizeCommentsPlatformState } from "@/lib/comments-platform-sanitize";
import {
  sanitizePostForSync,
  sanitizePostsPlatformState,
} from "@/lib/content-platform-sanitize";
import { mergeSinglePost } from "@/lib/content-platform-merge";
import { sanitizeDiscussionsPlatformState } from "@/lib/discussions-platform-sanitize";
import {
  mergeCommentsState,
  mergeDiscussionsState,
  mergeForumsState,
  mergePostsState,
} from "@/lib/content-platform-merge";
import { sanitizeForumsPlatformState } from "@/lib/forums-platform-sanitize";
import {
  getPlatformContent,
  setPlatformContent,
} from "@/lib/content-platform-store";
import type { FeedPost } from "@/types/database";

const POSTS_EMPTY: PostsPlatformState = {
  custom: [],
  deletedMockIds: [],
  deletedCustomIds: [],
  likeCounts: {},
};

const FORUMS_EMPTY: ForumsPlatformState = {
  custom: [],
  deletedMockIds: [],
  deletedCustomIds: [],
};

const COMMENTS_EMPTY: CommentsPlatformState = {
  custom: [],
  deletedMockIds: [],
};

const DISCUSSIONS_EMPTY: DiscussionsPlatformState = {
  customThreads: [],
  customReplies: [],
  deletedMockThreadIds: [],
};

function normalizePostsState(body: PostsPlatformState): PostsPlatformState {
  return sanitizePostsPlatformState({
    custom: Array.isArray(body.custom) ? body.custom : [],
    deletedMockIds: Array.isArray(body.deletedMockIds) ? body.deletedMockIds : [],
    deletedCustomIds: Array.isArray(body.deletedCustomIds) ? body.deletedCustomIds : [],
    likeCounts:
      body.likeCounts && typeof body.likeCounts === "object" ? body.likeCounts : {},
  });
}

function normalizeForumsState(body: ForumsPlatformState): ForumsPlatformState {
  return sanitizeForumsPlatformState({
    custom: Array.isArray(body.custom) ? body.custom : [],
    deletedMockIds: Array.isArray(body.deletedMockIds) ? body.deletedMockIds : [],
    deletedCustomIds: Array.isArray(body.deletedCustomIds) ? body.deletedCustomIds : [],
  });
}

function normalizeCommentsState(body: CommentsPlatformState): CommentsPlatformState {
  return sanitizeCommentsPlatformState({
    custom: Array.isArray(body.custom) ? body.custom : [],
    deletedMockIds: Array.isArray(body.deletedMockIds) ? body.deletedMockIds : [],
  });
}

function normalizeDiscussionsState(body: DiscussionsPlatformState): DiscussionsPlatformState {
  return sanitizeDiscussionsPlatformState({
    customThreads: Array.isArray(body.customThreads) ? body.customThreads : [],
    customReplies: Array.isArray(body.customReplies) ? body.customReplies : [],
    deletedMockThreadIds: Array.isArray(body.deletedMockThreadIds)
      ? body.deletedMockThreadIds
      : [],
  });
}

/** Upsert one post into platform state — server merges with the live record for that id. */
export async function upsertSinglePostPlatformState(
  incoming: FeedPost
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await getPlatformContent("posts", POSTS_EMPTY);
  const normalized = normalizePostsState(existing);
  const sanitized = sanitizePostForSync(incoming);
  const idx = normalized.custom.findIndex((post) => post.id === sanitized.id);

  const custom =
    idx === -1
      ? [sanitized, ...normalized.custom]
      : normalized.custom.map((post, i) =>
          i === idx ? mergeSinglePost(post, sanitized) : post
        );

  const merged = normalizePostsState({ ...normalized, custom });
  return setPlatformContent("posts", merged);
}

/** Merge incoming client state with live Supabase data — never wipe other users' content. */
export async function upsertPostsPlatformState(
  incoming: PostsPlatformState
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const existing = await getPlatformContent("posts", POSTS_EMPTY);
  const merged = normalizePostsState(
    mergePostsState(normalizePostsState(incoming), normalizePostsState(existing))
  );
  const result = await setPlatformContent("posts", merged);
  if (!result.ok) return result;
  return { ok: true, count: merged.custom.length };
}

export async function upsertForumsPlatformState(
  incoming: ForumsPlatformState
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const existing = await getPlatformContent("forums", FORUMS_EMPTY);
  const merged = normalizeForumsState(
    mergeForumsState(normalizeForumsState(incoming), normalizeForumsState(existing))
  );
  const result = await setPlatformContent("forums", merged);
  if (!result.ok) return result;
  return { ok: true, count: merged.custom.length };
}

export async function upsertCommentsPlatformState(
  incoming: CommentsPlatformState
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const existing = await getPlatformContent("comments", COMMENTS_EMPTY);
  const merged = normalizeCommentsState(
    mergeCommentsState(normalizeCommentsState(incoming), normalizeCommentsState(existing))
  );
  const result = await setPlatformContent("comments", merged);
  if (!result.ok) return result;
  return { ok: true, count: merged.custom.length };
}

export async function upsertDiscussionsPlatformState(
  incoming: DiscussionsPlatformState
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const existing = await getPlatformContent("discussions", DISCUSSIONS_EMPTY);
  const merged = normalizeDiscussionsState(
    mergeDiscussionsState(
      normalizeDiscussionsState(incoming),
      normalizeDiscussionsState(existing)
    )
  );
  const result = await setPlatformContent("discussions", merged);
  if (!result.ok) return result;
  return { ok: true, count: merged.customThreads.length };
}
