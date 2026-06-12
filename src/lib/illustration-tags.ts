import { normalizeTagList, sanitizeTagInput } from "@/lib/writing-tags";

export const ILLUSTRATION_TAG_SUGGESTIONS = [
  "illustration",
  "art",
  "portrait",
  "character-art",
  "map",
  "landscape",
  "fantasy",
  "sci-fi",
  "horror",
  "anime",
  "comics",
  "concept-art",
  "battle-map",
  "token",
  "item-art",
  "rpg",
  "worldbuilding",
  "sketch",
  "digital-painting",
] as const;

export const MAX_ILLUSTRATION_TAGS = 10;

export function normalizeIllustrationTagList(raw: string[]): string[] {
  return normalizeTagList(raw).slice(0, MAX_ILLUSTRATION_TAGS);
}

export { sanitizeTagInput };
