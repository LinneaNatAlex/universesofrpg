import type { ForumPost } from "@/types/database";

/** Soft page budget — pages may grow past A4; we only split after at least two replies. */
export const TOPIC_PAGE_CHAR_BUDGET = 3200;

/** Never paginate until a page already has this many replies (unless chapter ends). */
export const MIN_POSTS_PER_TOPIC_PAGE = 2;

const POST_LAYOUT_OVERHEAD = 56;

function estimatePostSize(post: ForumPost): number {
  return POST_LAYOUT_OVERHEAD + post.body.length + post.author_username.length;
}

/** Split chapter posts into reading pages (≥2 replies per page when possible). */
export function paginateForumPosts(posts: ForumPost[]): ForumPost[][] {
  if (posts.length === 0) return [[]];

  const pages: ForumPost[][] = [];
  let current: ForumPost[] = [];
  let currentSize = 0;

  for (const post of posts) {
    const postSize = estimatePostSize(post);

    if (
      current.length >= MIN_POSTS_PER_TOPIC_PAGE &&
      currentSize + postSize > TOPIC_PAGE_CHAR_BUDGET
    ) {
      pages.push(current);
      current = [post];
      currentSize = postSize;
      continue;
    }

    current.push(post);
    currentSize += postSize;
  }

  if (current.length > 0) {
    pages.push(current);
  }

  return pages;
}
