import type { FeedPost } from "@/types/database";

/** Profile-only character sheet — hidden from the public feed. */
export function isCharacterCreationPost(post: FeedPost): boolean {
  return post.show_on_feed === false;
}

export function isFeedVisibleCreation(post: FeedPost): boolean {
  return post.show_on_feed !== false;
}

export function filterFeedCreations(posts: FeedPost[]): FeedPost[] {
  return posts.filter(isFeedVisibleCreation);
}

export function filterCharacterCreations(posts: FeedPost[]): FeedPost[] {
  return posts.filter(isCharacterCreationPost);
}
