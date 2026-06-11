import { normalizeTag } from "@/lib/post-tags";
import type { PostType } from "@/types/database";

/** Suggested tags when publishing writing — readers filter by these in Explore. */
export const WRITING_TAG_SUGGESTIONS = [
  "writing",
  "story",
  "rpg",
  "poem",
  "poetry",
  "letter",
  "letters",
  "fiction",
  "fantasy",
  "sci-fi",
  "horror",
  "romance",
  "mystery",
  "journal",
  "essay",
  "lore",
  "campaign",
  "adventure",
  "character",
  "collab",
  "epistolary",
  "monologue",
  "flash-fiction",
] as const;

const STORY_LIKE_TAGS = new Set([
  "story",
  "rpg",
  "campaign",
  "chapter",
  "adventure",
  "horror",
]);

export const MAX_WRITING_TAGS = 10;

export function sanitizeTagInput(raw: string): string | null {
  const tag = normalizeTag(raw).replace(/[^a-z0-9-]/g, "");
  if (tag.length < 2 || tag.length > 32) return null;
  return tag;
}

export function normalizeTagList(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const tag = sanitizeTagInput(item);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= MAX_WRITING_TAGS) break;
  }
  return out;
}

/** Story-like tags map to story_segment; everything else stays text_writing. */
export function inferWritingPostType(tags: string[]): PostType {
  const normalized = normalizeTagList(tags);
  if (normalized.some((t) => STORY_LIKE_TAGS.has(t))) {
    return "story_segment";
  }
  return "text_writing";
}
