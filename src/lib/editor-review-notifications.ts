import { getAllEditorProfiles } from "@/lib/editor-profiles-store";
import { isPendingPaidListing } from "@/lib/moderation";
import {
  addEditorReviewNotification,
  clearEditorReviewNotifications,
} from "@/lib/notifications-store";
import type { FeedPost } from "@/types/database";

/** Ping every licensed editor when a paid listing needs review. */
export function notifyEditorsOfPendingReview(post: FeedPost): void {
  if (!isPendingPaidListing(post)) return;

  for (const editor of getAllEditorProfiles()) {
    addEditorReviewNotification({
      to_username: editor.username,
      post_id: post.id,
      post_title: post.title,
      post_type: post.type,
      creator_username: post.author.username,
      creator_display_name: post.author.display_name,
    });
  }
}

export function clearEditorReviewForPost(postId: string): void {
  clearEditorReviewNotifications(postId);
}
