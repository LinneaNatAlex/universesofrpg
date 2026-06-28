import { requiresCodePurchase } from "@/lib/posts";
import { syncVaultedCodeToServer } from "@/lib/post-code-vault";
import {
  dispatchPlatformSyncFailed,
  dispatchPlatformSyncOk,
} from "@/lib/platform-sync-events";
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

export function liveSyncErrorMessage(result: LiveSyncResult): string | null {
  if (!result.posts && !result.source) {
    return "Could not sync to the live server. Others will not see this until sync works — check Supabase keys on Netlify.";
  }
  if (!result.posts) {
    return "Saved on this device only — could not reach the live server. Others will not see it yet.";
  }
  if (result.needsSource && !result.source) {
    return "Listing synced, but template source code did not reach the server.";
  }
  return null;
}

/** Wait for server sync, then navigate. Returns error message if sync failed. */
export async function publishCreationLive(
  postId: string,
  navigate?: () => void
): Promise<string | null> {
  const post = getPostFromStore(postId);
  if (!post) return "Post not found after save.";

  const result = await syncCreationLive(post);
  const error = liveSyncErrorMessage(result);
  if (error) {
    dispatchPlatformSyncFailed(error);
    return error;
  }

  dispatchPlatformSyncOk();
  navigate?.();
  return null;
}

/** @deprecated Prefer publishCreationLive — this did not wait for sync. */
export function scheduleCreationLiveSync(postId: string): void {
  void publishCreationLive(postId);
}

/** RPG topics / forum stories — push to Supabase (server merges). */
export async function syncForumLive(): Promise<boolean> {
  const { syncForumsToServer } = await import("@/lib/forums-store");
  return syncForumsToServer();
}

export function forumLiveSyncErrorMessage(ok: boolean): string | null {
  if (ok) return null;
  return "Topic saved on this device only — could not reach the live server. Others will not see it until sync works.";
}

/** Wait for server sync before navigating. Returns error message if sync failed. */
export async function publishForumLive(navigate?: () => void): Promise<string | null> {
  const ok = await syncForumLive();
  const error = forumLiveSyncErrorMessage(ok);
  if (error) {
    dispatchPlatformSyncFailed(error);
    return error;
  }

  dispatchPlatformSyncOk();
  navigate?.();
  return null;
}

/** @deprecated Prefer publishForumLive — this navigated before sync finished. */
export function scheduleForumLiveSync(navigate?: () => void): void {
  void publishForumLive(navigate);
}

/** Community discussions — push to Supabase (server merges). */
export async function syncDiscussionLive(): Promise<boolean> {
  const { syncDiscussionsToServer } = await import("@/lib/discussions-store");
  return syncDiscussionsToServer();
}

export function discussionLiveSyncErrorMessage(ok: boolean): string | null {
  if (ok) return null;
  return "Discussion saved on this device only — could not reach the live server.";
}

export async function publishDiscussionLive(navigate?: () => void): Promise<string | null> {
  const ok = await syncDiscussionLive();
  const error = discussionLiveSyncErrorMessage(ok);
  if (error) {
    dispatchPlatformSyncFailed(error);
    return error;
  }

  dispatchPlatformSyncOk();
  navigate?.();
  return null;
}

export function scheduleDiscussionLiveSync(navigate?: () => void): void {
  void publishDiscussionLive(navigate);
}
