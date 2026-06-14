import { requiresCodePurchase } from "@/lib/posts";
import { syncVaultedCodeToServer } from "@/lib/post-code-vault";
import { getPostFromStore } from "@/lib/posts-store";
import { pushSinglePostToServer } from "@/lib/content-sync";
import type { FeedPost } from "@/types/database";

export type LiveSyncResult = {
  posts: boolean;
  source: boolean;
  needsSource: boolean;
};

/** Sync one post (+ vaulted source when paid) — server merges; no full-state round trip. */
export async function syncCreationLive(
  post: FeedPost
): Promise<LiveSyncResult> {
  const needsSource =
    post.type === "code_template" && requiresCodePurchase(post);

  const [posts, source] = await Promise.all([
    pushSinglePostToServer(post, { retries: 4 }),
    needsSource ? syncVaultedCodeToServer(post.id) : Promise.resolve(true),
  ]);

  return { posts, source, needsSource };
}

/** Fire-and-forget live sync after local save. */
export function scheduleCreationLiveSync(postId: string): void {
  const post = getPostFromStore(postId);
  if (!post) return;
  void syncCreationLive(post);
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

/** RPG topics / forum stories — push to Supabase (server merges). */
export async function syncForumLive(): Promise<boolean> {
  const { syncForumsToServer } = await import("@/lib/forums-store");
  return syncForumsToServer();
}

export function forumLiveSyncErrorMessage(ok: boolean): string | null {
  if (ok) return null;
  return "Topic saved locally but could not sync to the live server.";
}

export function scheduleForumLiveSync(navigate?: () => void): void {
  navigate?.();
  void syncForumLive();
}

/** Community discussions — push to Supabase (server merges). */
export async function syncDiscussionLive(): Promise<boolean> {
  const { syncDiscussionsToServer } = await import("@/lib/discussions-store");
  return syncDiscussionsToServer();
}

export function discussionLiveSyncErrorMessage(ok: boolean): string | null {
  if (ok) return null;
  return "Discussion saved locally but could not sync to the live server.";
}

export function scheduleDiscussionLiveSync(navigate?: () => void): void {
  navigate?.();
  void syncDiscussionLive();
}
