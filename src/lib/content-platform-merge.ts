import type { CommentsPlatformState } from "@/app/api/content/comments/route";
import type { HomepageChatPlatformState } from "@/app/api/content/homepage-chat/route";
import type { DiscussionsPlatformState } from "@/app/api/content/discussions/route";
import type { PostsPlatformState } from "@/app/api/content/posts/route";
import type { ForumsPlatformState } from "@/app/api/content/forums/route";
import { mergeRpgForumList } from "@/lib/forums-platform-merge";
import { normalizeFreeCodeListing } from "@/lib/moderation";
import { migrateFeedPost } from "@/lib/persona-rename";
import type { Comment, DiscussionReply, DiscussionThread, FeedPost, HomepageChatMessage } from "@/types/database";

function itemRevisionTime(item: {
  created_at?: string;
  updated_at?: string;
}): number {
  const stamp = item.updated_at ?? item.created_at ?? 0;
  return new Date(stamp).getTime();
}

function mergeRecordsById<
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

export function mergeSinglePost(local: FeedPost, remote: FeedPost): FeedPost {
  const a = normalizeFreeCodeListing(local);
  const b = normalizeFreeCodeListing(remote);
  const localTime = itemRevisionTime(a);
  const remoteTime = itemRevisionTime(b);
  if (localTime > remoteTime) return migrateFeedPost(a);
  if (remoteTime > localTime) return migrateFeedPost(b);
  if (a.pricing === "free" && b.pricing !== "free") return migrateFeedPost(a);
  if (b.pricing === "free" && a.pricing !== "free") return migrateFeedPost(b);
  if (a.moderation_status === "pending" && b.moderation_status === "approved") {
    return migrateFeedPost(a);
  }
  if (b.moderation_status === "pending" && a.moderation_status === "approved") {
    return migrateFeedPost(b);
  }
  return migrateFeedPost(a);
}

function mergePostsById(a: FeedPost[], b: FeedPost[]): FeedPost[] {
  const map = new Map<string, FeedPost>();
  for (const item of a) map.set(item.id, item);
  for (const item of b) {
    const prev = map.get(item.id);
    if (!prev) {
      map.set(item.id, item);
      continue;
    }
    map.set(item.id, mergeSinglePost(prev, item));
  }
  return [...map.values()];
}

function mergeStringLists(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

function discussionThreadRevisionTime(thread: DiscussionThread): number {
  const stamp = thread.last_activity_at ?? thread.created_at ?? 0;
  return new Date(stamp).getTime();
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
    custom: mergePostsById(local.custom ?? [], remote.custom ?? [])
      .filter((post) => !deletedCustomSet.has(post.id))
      .map((post) => migrateFeedPost(post)) as FeedPost[],
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

export function mergeCommentsState(
  local: CommentsPlatformState,
  remote: CommentsPlatformState
): CommentsPlatformState {
  return {
    custom: mergeRecordsById(local.custom ?? [], remote.custom ?? []) as Comment[],
    deletedMockIds: mergeStringLists(
      local.deletedMockIds ?? [],
      remote.deletedMockIds ?? []
    ),
  };
}

export function mergeHomepageChatState(
  local: HomepageChatPlatformState,
  remote: HomepageChatPlatformState
): HomepageChatPlatformState {
  const deletedIds = mergeStringLists(local.deletedIds ?? [], remote.deletedIds ?? []);
  const deletedSet = new Set(deletedIds);
  const messages = (
    mergeRecordsById(local.messages ?? [], remote.messages ?? []) as HomepageChatMessage[]
  )
    .filter((message) => !deletedSet.has(message.id))
    .sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  return {
    messages,
    deletedIds,
    nameColors: {
      ...(remote.nameColors ?? {}),
      ...(local.nameColors ?? {}),
    },
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
    customReplies: mergeRecordsById(
      local.customReplies ?? [],
      remote.customReplies ?? []
    ) as DiscussionReply[],
    deletedMockThreadIds,
  };
}
