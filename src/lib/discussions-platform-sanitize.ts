import type { DiscussionsPlatformState } from "@/app/api/content/discussions/route";
import type { DiscussionReply, DiscussionThread } from "@/types/database";

const MAX_TEXT_FIELD = 250_000;

function trimField(value: string | null | undefined): string {
  if (value == null) return "";
  if (value.length > MAX_TEXT_FIELD) return value.slice(0, MAX_TEXT_FIELD);
  return value;
}

function sanitizeThread(thread: DiscussionThread): DiscussionThread {
  return {
    ...thread,
    title: trimField(thread.title),
    body: trimField(thread.body),
    author_username: thread.author_username?.toLowerCase?.() ?? thread.author_username,
    tags: Array.isArray(thread.tags) ? thread.tags : [],
  };
}

function sanitizeReply(reply: DiscussionReply): DiscussionReply {
  return {
    ...reply,
    body: trimField(reply.body),
    author_username: reply.author_username?.toLowerCase?.() ?? reply.author_username,
  };
}

export function sanitizeDiscussionsPlatformState(
  state: DiscussionsPlatformState
): DiscussionsPlatformState {
  return {
    customThreads: Array.isArray(state.customThreads)
      ? state.customThreads.map(sanitizeThread)
      : [],
    customReplies: Array.isArray(state.customReplies)
      ? state.customReplies.map(sanitizeReply)
      : [],
    deletedMockThreadIds: Array.isArray(state.deletedMockThreadIds)
      ? state.deletedMockThreadIds
      : [],
  };
}
