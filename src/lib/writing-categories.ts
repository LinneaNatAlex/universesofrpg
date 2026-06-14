import { inferWritingPostType, normalizeTagList } from "@/lib/writing-tags";
import type { FeedPost, Post, PostType } from "@/types/database";

export const WRITING_CATEGORY_IDS = [
  "book",
  "chapter",
  "letter",
  "character",
  "poem",
  "journal",
  "essay",
  "monologue",
  "screenplay",
  "lore",
  "campaign",
  "flash-fiction",
] as const;

export type WritingCategoryId = (typeof WRITING_CATEGORY_IDS)[number];

export interface WritingCategoryMeta {
  id: WritingCategoryId;
  label: string;
  teaserLabel: string;
  synopsisHint: string;
  coverLabel: string;
  postType: PostType;
}

export const WRITING_CATEGORIES: WritingCategoryMeta[] = [
  {
    id: "book",
    label: "Book / novel",
    teaserLabel: "Back cover",
    synopsisHint: "What readers see on the back cover before they open the full piece…",
    coverLabel: "Cover image",
    postType: "story_segment",
  },
  {
    id: "chapter",
    label: "RPG chapter",
    teaserLabel: "Back cover",
    synopsisHint: "A short hook for your chapter — like the back of a campaign journal…",
    coverLabel: "Chapter art",
    postType: "story_segment",
  },
  {
    id: "letter",
    label: "Letter",
    teaserLabel: "Letter excerpt",
    synopsisHint: "A teaser from the letter — the first lines or a summary…",
    coverLabel: "Envelope / letter art",
    postType: "text_writing",
  },
  {
    id: "character",
    label: "Character creation",
    teaserLabel: "Character sheet",
    synopsisHint: "A quick snapshot — class, vibe, or hook for this character…",
    coverLabel: "Character portrait",
    postType: "character_sheet",
  },
  {
    id: "poem",
    label: "Poem",
    teaserLabel: "Preview",
    synopsisHint: "A few lines or a blurb about the poem…",
    coverLabel: "Cover art",
    postType: "text_writing",
  },
  {
    id: "journal",
    label: "Journal",
    teaserLabel: "Journal excerpt",
    synopsisHint: "A teaser entry or summary of what this journal covers…",
    coverLabel: "Journal cover",
    postType: "text_writing",
  },
  {
    id: "essay",
    label: "Essay",
    teaserLabel: "Preview",
    synopsisHint: "The thesis or opening hook for readers browsing Explore…",
    coverLabel: "Cover art",
    postType: "text_writing",
  },
  {
    id: "monologue",
    label: "Monologue",
    teaserLabel: "Preview",
    synopsisHint: "Who is speaking and what moment is this from?",
    coverLabel: "Scene art",
    postType: "text_writing",
  },
  {
    id: "screenplay",
    label: "Screenplay",
    teaserLabel: "Scene preview",
    synopsisHint: "Logline or a short scene setup…",
    coverLabel: "Poster / scene art",
    postType: "text_writing",
  },
  {
    id: "lore",
    label: "World lore",
    teaserLabel: "Lore excerpt",
    synopsisHint: "A taste of this lore entry — kingdom, faction, or legend…",
    coverLabel: "Lore illustration",
    postType: "story_segment",
  },
  {
    id: "campaign",
    label: "Campaign notes",
    teaserLabel: "Campaign preview",
    synopsisHint: "Session hook or party summary for GMs browsing…",
    coverLabel: "Campaign art",
    postType: "story_segment",
  },
  {
    id: "flash-fiction",
    label: "Flash fiction",
    teaserLabel: "Preview",
    synopsisHint: "A micro-hook — one or two sentences…",
    coverLabel: "Cover art",
    postType: "text_writing",
  },
];

const CATEGORY_BY_ID = new Map(WRITING_CATEGORIES.map((c) => [c.id, c]));

export function isWritingCategoryId(value: string): value is WritingCategoryId {
  return CATEGORY_BY_ID.has(value as WritingCategoryId);
}

export function getWritingCategoryMeta(id: WritingCategoryId): WritingCategoryMeta {
  return CATEGORY_BY_ID.get(id) ?? WRITING_CATEGORIES[0];
}

export function isWritingPostType(type: PostType): boolean {
  return type === "story_segment" || type === "text_writing";
}

export function inferWritingCategoryFromTags(
  tags: string[],
  postType?: PostType
): WritingCategoryId {
  const normalized = new Set(normalizeTagList(tags));
  if (normalized.has("letter") || normalized.has("letters") || normalized.has("epistolary")) {
    return "letter";
  }
  if (normalized.has("character")) return "character";
  if (normalized.has("poem") || normalized.has("poetry")) return "poem";
  if (normalized.has("journal")) return "journal";
  if (normalized.has("essay")) return "essay";
  if (normalized.has("monologue")) return "monologue";
  if (normalized.has("screenplay")) return "screenplay";
  if (normalized.has("lore")) return "lore";
  if (normalized.has("campaign")) return "campaign";
  if (normalized.has("flash-fiction")) return "flash-fiction";
  if (normalized.has("chapter") || normalized.has("adventure")) return "chapter";
  if (normalized.has("story") || normalized.has("fiction") || postType === "story_segment") {
    return "book";
  }
  return "poem";
}

export function resolveWritingCategory(
  post: Pick<Post, "type" | "tags" | "writing_category">
): WritingCategoryId {
  if (post.writing_category && isWritingCategoryId(post.writing_category)) {
    return post.writing_category;
  }
  if (isWritingPostType(post.type)) {
    return inferWritingCategoryFromTags(post.tags, post.type);
  }
  return "book";
}

export function getWritingCategoryLabel(post: Pick<Post, "type" | "tags" | "writing_category">): string | null {
  if (!isWritingPostType(post.type)) return null;
  return getWritingCategoryMeta(resolveWritingCategory(post)).label;
}

export function getWritingTeaserLabel(post: Pick<Post, "type" | "tags" | "writing_category">): string {
  if (!isWritingPostType(post.type)) return "Preview";
  return getWritingCategoryMeta(resolveWritingCategory(post)).teaserLabel;
}

export function inferWritingPostTypeForCategory(
  category: WritingCategoryId,
  tags: string[]
): PostType {
  return getWritingCategoryMeta(category).postType ?? inferWritingPostType(tags);
}
