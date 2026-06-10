import { getCommentCount } from "@/lib/mock-comments";
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
