import { normalizeTag } from "@/lib/post-tags";

export const TOPIC_CATEGORIES = [
  "fantasy",
  "horror",
  "sci-fi",
  "modern",
  "historical",
  "cyberpunk",
  "romance",
  "mystery",
  "comedy",
  "sandbox",
] as const;

export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];

export const TOPIC_TAG_SUGGESTIONS = [
  "rpg",
  "play-by-post",
  "campaign",
  "one-shot",
  "collab",
  "story",
  "horror",
  "fantasy",
  "sci-fi",
  "mystery",
  "romance",
  "exploration",
  "combat",
  "roleplay",
  "lore",
  "sandbox",
  "gothic",
  "noir",
  "steampunk",
] as const;

export const MAX_TOPIC_TAGS = 8;

export function sanitizeTopicTag(raw: string): string | null {
  const tag = normalizeTag(raw).replace(/[^a-z0-9-]/g, "");
  if (tag.length < 2 || tag.length > 32) return null;
  return tag;
}

export function normalizeTopicTagList(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const tag = sanitizeTopicTag(item);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= MAX_TOPIC_TAGS) break;
  }
  return out;
}

export function normalizeTopicCategory(raw: string): TopicCategory {
  const key = sanitizeTopicTag(raw) ?? "sandbox";
  return TOPIC_CATEGORIES.includes(key as TopicCategory)
    ? (key as TopicCategory)
    : "sandbox";
}

export function getForumTags(forum: {
  category: string;
  tags: string[];
}): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const category = sanitizeTopicTag(forum.category);
  if (category) {
    seen.add(category);
    out.push(category);
  }
  for (const raw of forum.tags) {
    const tag = sanitizeTopicTag(raw);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

export function forumMatchesTopicSearch(
  forum: {
    title: string;
    plot_synopsis?: string | null;
    category: string;
    tags: string[];
    members: string[];
  },
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (forum.title.toLowerCase().includes(q)) return true;
  if (forum.plot_synopsis?.toLowerCase().includes(q)) return true;
  if (getForumTags(forum).some((t) => t.includes(q) || q.includes(t))) return true;
  return forum.members.some((m) => m.toLowerCase().includes(q));
}
