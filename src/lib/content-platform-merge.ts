import type { CommentsPlatformState } from "@/app/api/content/comments/route";
import type { DiscussionsPlatformState } from "@/app/api/content/discussions/route";
import type { PostsPlatformState } from "@/app/api/content/posts/route";
import type { ForumsPlatformState } from "@/app/api/content/forums/route";
import { mergeRpgForumList } from "@/lib/forums-platform-merge";
import { migrateFeedPost } from "@/lib/persona-rename";
import type { Comment, DiscussionReply, DiscussionThread, FeedPost } from "@/types/database";

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
