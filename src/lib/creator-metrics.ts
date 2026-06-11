import { getCommentCount } from "@/lib/mock-comments";
import { getCreatorFollowerCount } from "@/lib/creator-follows-store";
import { getAllPosts } from "@/lib/posts-store";

export interface CreatorMetrics {
  username: string;
  posts_count: number;
  total_likes: number;
  total_comments: number;
  follower_count: number;
  /** Highest like count on a single approved post. */
  max_likes_on_post: number;
}

/** Minimum stats before someone can subscribe to verified creator. */
export const VERIFICATION_THRESHOLDS = {
  min_followers: 300,
  min_likes_per_post: 50,
  min_posts: 1,
} as const;

export function getCreatorMetrics(username: string): CreatorMetrics {
  const posts = getAllPosts().filter(
    (p) =>
      p.author.username.toLowerCase() === username.toLowerCase() &&
      p.moderation_status === "approved"
  );

  const likeCounts = posts.map((p) => p.like_count);

  return {
    username,
    posts_count: posts.length,
    total_likes: likeCounts.reduce((sum, n) => sum + n, 0),
    total_comments: posts.reduce((sum, p) => sum + getCommentCount(p.id), 0),
    follower_count: getCreatorFollowerCount(username),
    max_likes_on_post: likeCounts.length > 0 ? Math.max(...likeCounts) : 0,
  };
}

export function meetsVerificationThresholds(metrics: CreatorMetrics): boolean {
  return (
    metrics.posts_count >= VERIFICATION_THRESHOLDS.min_posts &&
    metrics.follower_count >= VERIFICATION_THRESHOLDS.min_followers &&
    metrics.max_likes_on_post >= VERIFICATION_THRESHOLDS.min_likes_per_post
  );
}

export function getVerificationEligibilityGaps(metrics: CreatorMetrics): string[] {
  const gaps: string[] = [];

  if (metrics.posts_count < VERIFICATION_THRESHOLDS.min_posts) {
    gaps.push("Publish at least one approved post.");
  }
  if (metrics.follower_count < VERIFICATION_THRESHOLDS.min_followers) {
    const need = VERIFICATION_THRESHOLDS.min_followers - metrics.follower_count;
    gaps.push(
      `${need} more follower${need === 1 ? "" : "s"} (${metrics.follower_count}/${VERIFICATION_THRESHOLDS.min_followers}).`
    );
  }
  if (metrics.max_likes_on_post < VERIFICATION_THRESHOLDS.min_likes_per_post) {
    gaps.push(
      `A post with at least ${VERIFICATION_THRESHOLDS.min_likes_per_post} likes (best post: ${metrics.max_likes_on_post}/${VERIFICATION_THRESHOLDS.min_likes_per_post}).`
    );
  }

  return gaps;
}
