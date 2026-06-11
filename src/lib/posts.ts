import { getCommentCount } from "@/lib/mock-comments";
import { hasPurchased } from "@/lib/purchases-store";
import { getPostFromStore, getAllPosts } from "@/lib/posts-store";
import type { FeedPost } from "@/types/database";

function withCommentCount(post: FeedPost): FeedPost {
  return { ...post, comment_count: getCommentCount(post.id) };
}

export function getPostById(id: string): FeedPost | undefined {
  const post = getPostFromStore(id);
  return post ? withCommentCount(post) : undefined;
}

export function getFeedPosts(): FeedPost[] {
  return getAllPosts()
    .filter((p) => p.moderation_status === "approved")
    .map(withCommentCount);
}

export function getFreePosts(): FeedPost[] {
  return getFeedPosts().filter((p) => p.pricing === "free");
}

export function canViewFullContent(
  isLoggedIn: boolean,
  inviteToken?: string | null,
  postInviteToken?: string | null
): boolean {
  if (isLoggedIn) return true;
  if (inviteToken && postInviteToken && inviteToken === postInviteToken) return true;
  return false;
}

/** Paid code templates always lock source; free templates may opt in via is_code_locked. */
export function requiresCodePurchase(post: FeedPost): boolean {
  if (post.type !== "code_template") return false;
  return post.pricing !== "free" || post.is_code_locked;
}

export function canViewCodeSource(
  post: FeedPost,
  opts: {
    isLoggedIn: boolean;
    username: string | null;
    inviteToken?: string | null;
  }
): boolean {
  if (post.type !== "code_template") return false;
  if (!post.html_code && !post.css_code && !post.js_code) return false;

  // Free templates — full source for everyone (no login or purchase).
  if (!requiresCodePurchase(post)) {
    return true;
  }

  if (!opts.isLoggedIn || !opts.username) return false;
  if (post.author.username.toLowerCase() === opts.username.toLowerCase()) return true;
  return hasPurchased(opts.username, post.id);
}

/** Layout preview is always visible for code templates with source present. */
export function canViewCodePreview(post: FeedPost): boolean {
  return post.type === "code_template" && !!(post.html_code && post.css_code);
}
