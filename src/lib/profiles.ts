import { isPublicFeedPost } from "@/lib/moderation";
import { MOCK_FEED } from "@/lib/mock-data";
import type { FeedPost, Profile } from "@/types/database";

export function getProfileByUsername(
  username: string
): { profile: Profile; creations: FeedPost[] } | null {
  const normalized = username.toLowerCase();
  const creations = MOCK_FEED.filter(
    (p) =>
      p.author.username.toLowerCase() === normalized && isPublicFeedPost(p)
  );

  const profile =
    creations[0]?.author ??
    MOCK_FEED.find((p) => p.author.username.toLowerCase() === normalized)?.author;

  if (!profile) return null;

  return { profile, creations };
}
