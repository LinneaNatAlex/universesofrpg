import { requiresCodePurchase } from "@/lib/posts";
import { syncVaultedCodeToServer } from "@/lib/post-code-vault";
import { syncPostsToServer } from "@/lib/posts-store";
import type { FeedPost } from "@/types/database";

export type LiveSyncResult = {
  posts: boolean;
  source: boolean;
  needsSource: boolean;
};

/** Wait for posts + paid template source to reach Supabase after a local save. */
export async function syncCreationLive(post: Pick<FeedPost, "id" | "type" | "pricing">): Promise<LiveSyncResult> {
  const needsSource =
    post.type === "code_template" && requiresCodePurchase(post as FeedPost);

  const [posts, source] = await Promise.all([
    syncPostsToServer(),
    needsSource ? syncVaultedCodeToServer(post.id) : Promise.resolve(true),
  ]);

  return { posts, source, needsSource };
}

export function liveSyncErrorMessage(result: LiveSyncResult): string | null {
  if (!result.posts && !result.source) {
    return "Could not sync listing or source code to the live server.";
  }
  if (!result.posts) {
    return "Listing saved locally but could not sync to the live server.";
  }
  if (result.needsSource && !result.source) {
    return "Listing synced, but template source code did not reach the server.";
  }
  return null;
}
