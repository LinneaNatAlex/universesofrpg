import { normalizeTag } from "@/lib/post-tags";
import type { DiscussionThread } from "@/types/database";

export const DISCUSSION_CATEGORIES = [
  "general",
  "help",
  "feedback",
  "creators",
  "shop",
  "rpg-tips",
  "worldbuilding",
  "off-topic",
  "fantasy",
  "horror",
  "sci-fi",
] as const;

export type DiscussionCategory = (typeof DISCUSSION_CATEGORIES)[number];

export const DISCUSSION_TAG_SUGGESTIONS = [
  "beginner",
  "rules",
  "lore",
  "characters",
  "maps",
  "tools",
  "templates",
  "collab",
  "writing",
  "art",
  "music",
  "homebrew",
  "session-zero",
  "dm-advice",
  "player-advice",
] as const;

export const MAX_DISCUSSION_TAGS = 6;

export function sanitizeDiscussionTag(raw: string): string | null {
  const tag = normalizeTag(raw).replace(/[^a-z0-9-]/g, "");
  if (tag.length < 2 || tag.length > 32) return null;
  return tag;
}

export function normalizeDiscussionTagList(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const tag = sanitizeDiscussionTag(item);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= MAX_DISCUSSION_TAGS) break;
  }
  return out;
}

export function normalizeDiscussionCategory(raw: string): DiscussionCategory {
  const key = sanitizeDiscussionTag(raw) ?? "general";
  return DISCUSSION_CATEGORIES.includes(key as DiscussionCategory)
    ? (key as DiscussionCategory)
    : "general";
}

export function getDiscussionTags(thread: Pick<DiscussionThread, "category" | "tags">): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const category = sanitizeDiscussionTag(thread.category);
  if (category) {
    seen.add(category);
    out.push(category);
  }
  for (const raw of thread.tags) {
    const tag = sanitizeDiscussionTag(raw);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

export function discussionMatchesSearch(
  thread: Pick<
    DiscussionThread,
    "title" | "body" | "category" | "tags" | "author_username" | "author_display_name"
  >,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (thread.title.toLowerCase().includes(q)) return true;
  if (thread.body.toLowerCase().includes(q)) return true;
  if (thread.author_username.toLowerCase().includes(q)) return true;
  if (thread.author_display_name.toLowerCase().includes(q)) return true;
  return getDiscussionTags(thread).some((t) => t.includes(q) || q.includes(t));
}

export function discussionPopularityScore(thread: DiscussionThread): number {
  return thread.reply_count * 3 + thread.views;
}
