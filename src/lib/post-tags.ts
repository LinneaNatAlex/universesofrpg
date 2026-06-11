import type { FeedPost } from "@/types/database";

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/^#/, "");
}

/** All tags on a post (content + style), normalized and deduped. */
export function getPostTags(post: FeedPost): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...post.tags, ...post.style_tags]) {
    const tag = normalizeTag(raw);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

export function postHasTag(post: FeedPost, tag: string): boolean {
  const needle = normalizeTag(tag);
  if (!needle) return true;
  return getPostTags(post).includes(needle);
}

export function postMatchesTagFilter(post: FeedPost, activeTag: string | null): boolean {
  if (!activeTag) return true;
  return postHasTag(post, activeTag);
}

export function postMatchesSearchQuery(post: FeedPost, query: string): boolean {
  const q = normalizeTag(query);
  if (!q) return true;

  const tags = getPostTags(post);
  if (tags.some((t) => t === q || t.startsWith(q) || t.includes(q))) return true;

  return (
    post.title.toLowerCase().includes(q) ||
    post.author.display_name.toLowerCase().includes(q) ||
    post.author.username.toLowerCase().includes(q) ||
    (post.description ?? "").toLowerCase().includes(q) ||
    (post.plot_synopsis ?? "").toLowerCase().includes(q) ||
    tags.some((t) => t.startsWith(q))
  );
}

/** Unique tags across posts, sorted — used for Explore browse chips. */
export function collectTagsFromPosts(posts: FeedPost[]): string[] {
  const tags = new Set<string>();
  for (const post of posts) {
    getPostTags(post).forEach((t) => tags.add(t));
  }
  return [...tags].sort();
}

export function mergeTagLists(...lists: string[][]): string[] {
  const tags = new Set<string>();
  for (const list of lists) {
    for (const raw of list) {
      const tag = normalizeTag(raw);
      if (tag) tags.add(tag);
    }
  }
  return [...tags].sort();
}
