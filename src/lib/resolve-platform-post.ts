import { MOCK_FEED } from "@/lib/mock-data";
import { getPostFromPlatform } from "@/lib/posts-platform-server";
import type { FeedPost } from "@/types/database";

/** Resolve a post for server-side marketplace/library views (Supabase + demo seed). */
export async function resolvePlatformPostById(postId: string): Promise<FeedPost | null> {
  const fromPlatform = await getPostFromPlatform(postId);
  if (fromPlatform?.author) return fromPlatform;

  const mock = MOCK_FEED.find((p) => p.id === postId);
  if (!mock?.author) return null;
  return mock;
}
