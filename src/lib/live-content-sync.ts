import { requiresCodePurchase } from "@/lib/posts";
import { syncVaultedCodeToServer } from "@/lib/post-code-vault";
import { syncPostsToServer } from "@/lib/posts-store";
import type { FeedPost } from "@/types/database";

export type LiveSyncResult = {
  posts: boolean;
  source: boolean;
  needsSource: boolean;
};

const LIVE_SYNC_SETUP_HINT =
  "Add SUPABASE_SERVICE_ROLE_KEY on Netlify, run migrations 005 and 006, then try again while logged in on the live site.";

/** Wait for posts + paid template source to reach Supabase after a local save. */
export async function syncCreationLive(
  post: Pick<FeedPost, "id" | "type" | "pricing">
): Promise<LiveSyncResult> {
  const needsSource =
    post.type === "code_template" && requiresCodePurchase(post as FeedPost);

  const posts = await syncPostsToServer();
  if (!posts) {
    return { posts: false, source: false, needsSource };
  }

  const source = needsSource ? await syncVaultedCodeToServer(post.id) : true;

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

export function liveSyncSetupHint(): string {
  return LIVE_SYNC_SETUP_HINT;
}

/** RPG topics / forum stories — fetch-merge-push to Supabase. */
export async function syncForumLive(): Promise<boolean> {
  const { syncForumsToServer } = await import("@/lib/forums-store");
  return syncForumsToServer();
}

export function forumLiveSyncErrorMessage(ok: boolean): string | null {
  if (ok) return null;
  return "Topic saved locally but could not sync to the live server.";
}

/** Community discussions — fetch-merge-push to Supabase. */
export async function syncDiscussionLive(): Promise<boolean> {
  const { syncDiscussionsToServer } = await import("@/lib/discussions-store");
  return syncDiscussionsToServer();
}

export function discussionLiveSyncErrorMessage(ok: boolean): string | null {
  if (ok) return null;
  return "Discussion saved locally but could not sync to the live server.";
}
