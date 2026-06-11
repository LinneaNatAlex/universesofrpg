import type { CommentsPlatformState } from "@/app/api/content/comments/route";
import type { Comment } from "@/types/database";

const MAX_TEXT_FIELD = 50_000;

function trimField(value: string | null | undefined): string {
  if (value == null) return "";
  if (value.length > MAX_TEXT_FIELD) return value.slice(0, MAX_TEXT_FIELD);
  return value;
}

function sanitizeComment(comment: Comment): Comment {
  return {
    ...comment,
    body: trimField(comment.body),
    author_username: comment.author_username?.toLowerCase?.() ?? comment.author_username,
    parent_comment_id: comment.parent_comment_id ?? null,
  };
}

export function sanitizeCommentsPlatformState(
  state: CommentsPlatformState
): CommentsPlatformState {
  return {
    custom: Array.isArray(state.custom) ? state.custom.map(sanitizeComment) : [],
    deletedMockIds: Array.isArray(state.deletedMockIds) ? state.deletedMockIds : [],
  };
}
