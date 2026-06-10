import type { FeedPost, PostType } from "@/types/database";

export type SpotlightCategoryId = "book" | "comic" | "character" | "profile";

export interface SpotlightCategory {
  id: SpotlightCategoryId;
  label: string;
  subtitle: string;
  matches: (post: FeedPost) => boolean;
}

export const SPOTLIGHT_CATEGORIES: SpotlightCategory[] = [
  {
    id: "book",
    label: "Best Book",
    subtitle: "Top-rated story this month",
    matches: (p) =>
      p.type === "story_segment" ||
      p.type === "text_writing" ||
      p.type === "collab_thread",
  },
  {
    id: "character",
    label: "Best Character",
    subtitle: "Fan-favourite character sheet",
    matches: (p) => p.type === "character_sheet",
  },
  {
    id: "comic",
    label: "Best Comic",
    subtitle: "Most loved illustrated work",
    matches: (p) =>
      p.type === "digital_asset" ||
      (p.style_tags.includes("comics") && p.type === "story_segment"),
  },
  {
    id: "profile",
    label: "Best Profile",
    subtitle: "Top-rated code & layout theme",
    matches: (p) => p.type === "code_template",
  },
];

export interface SpotlightPick {
  category: SpotlightCategory;
  post: FeedPost;
  score: number;
}

export function engagementScore(post: FeedPost): number {
  return post.like_count + post.comment_count * 3;
}

function isThisMonth(dateIso: string, now = new Date()): boolean {
  const d = new Date(dateIso);
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
}

function pickTopInCategory(
  posts: FeedPost[],
  category: SpotlightCategory,
  monthOnly: boolean
): FeedPost | null {
  const pool = posts.filter(category.matches);
  const monthly = monthOnly ? pool.filter((p) => isThisMonth(p.created_at)) : [];
  const candidates = monthly.length > 0 ? monthly : pool;
  if (candidates.length === 0) return null;

  return [...candidates].sort(
    (a, b) => engagementScore(b) - engagementScore(a)
  )[0];
}

export function getMonthlySpotlight(posts: FeedPost[]): SpotlightPick[] {
  const approved = posts.filter((p) => p.moderation_status === "approved");
  const usedIds = new Set<string>();
  const picks: SpotlightPick[] = [];

  for (const category of SPOTLIGHT_CATEGORIES) {
    const available = approved.filter((p) => !usedIds.has(p.id));
    const post = pickTopInCategory(available, category, true);
    if (!post) continue;
    usedIds.add(post.id);
    picks.push({
      category,
      post,
      score: engagementScore(post),
    });
  }

  return picks;
}

export function formatSpotlightMonth(now = new Date()): string {
  return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export const SPOTLIGHT_TYPE_HINTS: Partial<Record<PostType, string>> = {
  story_segment: "RPG story",
  text_writing: "Epistolary writing",
  collab_thread: "Collaborative thread",
  digital_asset: "Art & assets",
  character_sheet: "Character sheet",
  code_template: "Profile theme",
};
