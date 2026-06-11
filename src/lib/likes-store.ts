import { findUserByUsername } from "@/lib/discover-users";
import {
  addPostLikeNotification,
  removePostLikeNotificationActor,
} from "@/lib/notifications-store";
import { adjustLikeCount, getPostFromStore } from "@/lib/posts-store";

type Listener = () => void;
const listeners = new Set<Listener>();

const likedByUser = new Map<string, Set<string>>();

function notify() {
  listeners.forEach((l) => l());
}

function storageKey(username: string) {
  return `uorpg-likes:${username.toLowerCase()}`;
}

function getLikedSet(username: string): Set<string> {
  const key = username.toLowerCase();
  if (!likedByUser.has(key)) {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(storageKey(key));
        likedByUser.set(key, new Set(raw ? (JSON.parse(raw) as string[]) : []));
      } catch {
        likedByUser.set(key, new Set());
      }
    } else {
      likedByUser.set(key, new Set());
    }
  }
  return likedByUser.get(key)!;
}

function persist(username: string) {
  if (typeof window === "undefined") return;
  const set = getLikedSet(username);
  localStorage.setItem(storageKey(username), JSON.stringify([...set]));
}

export function subscribeLikes(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isPostLiked(username: string, postId: string): boolean {
  return getLikedSet(username).has(postId);
}

export function toggleLike(
  username: string,
  postId: string,
  actorDisplayName?: string
): { liked: boolean; count: number } {
  const set = getLikedSet(username);
  const wasLiked = set.has(postId);
  const post = getPostFromStore(postId);
  const displayName =
    actorDisplayName ?? findUserByUsername(username)?.display_name ?? username;

  if (wasLiked) {
    set.delete(postId);
    adjustLikeCount(postId, -1);
    if (post) {
      removePostLikeNotificationActor({
        to_username: post.author.username,
        post_id: postId,
        actor_username: username,
      });
    }
  } else {
    set.add(postId);
    adjustLikeCount(postId, 1);
    if (post) {
      addPostLikeNotification({
        to_username: post.author.username,
        post_id: postId,
        post_title: post.title,
        actor_username: username,
        actor_display_name: displayName,
      });
    }
  }

  persist(username);
  notify();

  const updated = getPostFromStore(postId);
  return { liked: !wasLiked, count: updated?.like_count ?? 0 };
}
