import type { CommentsPlatformState } from "@/app/api/content/comments/route";
import { readJson, writeJson } from "@/lib/browser-storage";
import {
  pushCommentsPlatformState,
  scheduleCommentsPlatformPush,
} from "@/lib/content-sync";
import { addPostCommentNotification } from "@/lib/notifications-store";
import { getPostFromStore } from "@/lib/posts-store";
import type { Comment } from "@/types/database";

const STORAGE_KEY = "uorpg-comments-state";
const MOCK_COMMENT_IDS = new Set(["c1", "c2", "c3", "c4", "c5"]);

export const MOCK_COMMENTS: Comment[] = [
  {
    id: "c1",
    post_id: "1",
    author_id: "u2",
    author_username: "roninforge",
    author_display_name: "Ronin Forge",
    body: "Love the rune borders — would work great on a cyber-fantasy sheet too.",
    parent_comment_id: null,
    created_at: "2026-06-08T14:22:00Z",
  },
  {
    id: "c2",
    post_id: "1",
    author_id: "u3",
    author_username: "leon_jezz",
    author_display_name: "Leon Jezz",
    body: "Forked this for my horror campaign profile. The inventory tab idea is chef's kiss.",
    parent_comment_id: null,
    created_at: "2026-06-09T09:10:00Z",
  },
  {
    id: "c1r1",
    post_id: "1",
    author_id: "u1",
    author_username: "chaz_copper",
    author_display_name: "Chaz Copper",
    body: "The inventory tab idea is genius — stealing that for my next sheet.",
    parent_comment_id: "c2",
    created_at: "2026-06-09T11:00:00Z",
  },
  {
    id: "c3",
    post_id: "3",
    author_id: "u1",
    author_username: "chaz_copper",
    author_display_name: "Chaz Copper",
    body: "The gate breathing line gave me chills. Ready for turn 13 whenever you are.",
    parent_comment_id: null,
    created_at: "2026-06-07T18:45:00Z",
  },
  {
    id: "c4",
    post_id: "3",
    author_id: "u2",
    author_username: "roninforge",
    author_display_name: "Ronin Forge",
    body: "This synopsis alone sold me — signing up to read the full thread.",
    parent_comment_id: null,
    created_at: "2026-06-08T11:30:00Z",
  },
  {
    id: "c5",
    post_id: "4",
    author_id: "u3",
    author_username: "leon_jezz",
    author_display_name: "Leon Jezz",
    body: "Epistolary fantasy is underrated. The margin voice tease in the synopsis is perfect.",
    parent_comment_id: null,
    created_at: "2026-06-09T16:00:00Z",
  },
];

export type CommentsState = CommentsPlatformState;

let comments: Comment[] = [...MOCK_COMMENTS];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function mergeComments() {
  const state = readJson<CommentsState>(STORAGE_KEY, { custom: [], deletedMockIds: [] });
  const deleted = new Set(state.deletedMockIds);
  const map = new Map<string, Comment>();

  for (const mock of MOCK_COMMENTS) {
    if (!deleted.has(mock.id)) {
      map.set(mock.id, { ...mock, parent_comment_id: mock.parent_comment_id ?? null });
    }
  }
  for (const custom of state.custom) {
    map.set(custom.id, { ...custom, parent_comment_id: custom.parent_comment_id ?? null });
  }

  comments = [...map.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function ensureLoaded() {
  if (typeof window === "undefined") return;
  if (storageLoaded) return;
  storageLoaded = true;
  mergeComments();
}

export function buildCommentsPersistState(): CommentsState {
  ensureLoaded();
  const currentIds = new Set(comments.map((c) => c.id));
  return {
    custom: comments.filter((c) => !MOCK_COMMENT_IDS.has(c.id)),
    deletedMockIds: MOCK_COMMENTS.filter((c) => !currentIds.has(c.id)).map((c) => c.id),
  };
}

export function applyCommentsPersistState(state: CommentsState): void {
  if (typeof window === "undefined") return;
  writeJson(STORAGE_KEY, {
    custom: Array.isArray(state.custom) ? state.custom : [],
    deletedMockIds: Array.isArray(state.deletedMockIds) ? state.deletedMockIds : [],
  });
  storageLoaded = false;
  comments = [...MOCK_COMMENTS];
  ensureLoaded();
  notify();
}

export async function syncCommentsToServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return pushCommentsPlatformState(buildCommentsPersistState());
}

function persist() {
  if (typeof window === "undefined") return;
  ensureLoaded();
  const state = buildCommentsPersistState();
  writeJson(STORAGE_KEY, state);
  scheduleCommentsPlatformPush(state);
}

export function subscribeComments(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCommentsForPost(postId: string): Comment[] {
  ensureLoaded();
  return comments
    .filter((c) => c.post_id === postId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function getCommentCount(postId: string): number {
  ensureLoaded();
  return comments.filter((c) => c.post_id === postId).length;
}

export function getTopLevelCommentCount(postId: string): number {
  ensureLoaded();
  return comments.filter((c) => c.post_id === postId && !c.parent_comment_id).length;
}

export function addComment(comment: Comment): void {
  ensureLoaded();
  comments.push(comment);
  persist();
  notify();

  const post = getPostFromStore(comment.post_id);
  if (post) {
    addPostCommentNotification({
      to_username: post.author.username,
      post_id: comment.post_id,
      post_title: post.title,
      comment_id: comment.id,
      author_username: comment.author_username,
      author_display_name: comment.author_display_name,
      excerpt: comment.body,
    });
  }

  void syncCommentsToServer();
}

export function getAllComments(): Comment[] {
  ensureLoaded();
  return [...comments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function deleteComment(id: string): boolean {
  ensureLoaded();
  const before = comments.length;
  comments = comments.filter((c) => c.id !== id);
  if (comments.length < before) {
    persist();
    notify();
    void syncCommentsToServer();
    return true;
  }
  return false;
}
