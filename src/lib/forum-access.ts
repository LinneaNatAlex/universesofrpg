import { hasPurchased } from "@/lib/purchases-store";
import type { RpgForum } from "@/types/database";

export type ForumAccessLevel = "full" | "teaser" | "none";

function isMember(forum: RpgForum, username: string): boolean {
  const key = username.toLowerCase();
  return forum.members.some((m) => m.toLowerCase() === key);
}

export function getForumAccessLevel(
  forum: RpgForum,
  username: string | null | undefined
): ForumAccessLevel {
  const key = username?.toLowerCase() ?? null;
  if (key && isMember(forum, key)) return "full";
  if (forum.is_private) return "none";
  if (forum.shop_post_id) {
    if (key && hasPurchased(key, forum.shop_post_id)) return "full";
    return "teaser";
  }
  return "full";
}

export function isForumVisibleInList(
  forum: RpgForum,
  username: string | null | undefined
): boolean {
  if (!forum.is_private) return true;
  if (!username) return false;
  return isMember(forum, username);
}

export function isForumCreator(forum: RpgForum, username: string): boolean {
  return forum.creator_username.toLowerCase() === username.toLowerCase();
}

export function formatPartLabel(chapter: { number: number; title: string }): string {
  const defaultTitle = `Part ${chapter.number}`;
  if (!chapter.title.trim() || chapter.title === `Chapter ${chapter.number}`) {
    return defaultTitle;
  }
  if (chapter.title.startsWith("Part ") || chapter.title.startsWith("Chapter ")) {
    return chapter.title.replace(/^Chapter /, "Part ");
  }
  return `Part ${chapter.number}: ${chapter.title}`;
}
