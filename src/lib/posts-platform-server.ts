import type { PostsPlatformState } from "@/app/api/content/posts/route";
import { getPlatformContent } from "@/lib/content-platform-store";
import { migrateFeedPost } from "@/lib/persona-rename";
import type { FeedPost } from "@/types/database";

const EMPTY: PostsPlatformState = {
  custom: [],
  deletedMockIds: [],
  deletedCustomIds: [],
  likeCounts: {},
};

export async function getPostFromPlatform(postId: string): Promise<FeedPost | null> {
  const state = await getPlatformContent<PostsPlatformState>("posts", EMPTY);
  const deleted = new Set([
    ...(state.deletedMockIds ?? []),
    ...(state.deletedCustomIds ?? []),
  ]);
  if (deleted.has(postId)) return null;

  const custom = Array.isArray(state.custom) ? state.custom : [];
  const found = custom.find((p) => p.id === postId);
  return found ? migrateFeedPost(found) : null;
}
