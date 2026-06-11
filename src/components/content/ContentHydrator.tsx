"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  CONTENT_SYNCED_EVENT,
  fetchCommentsPlatformState,
  fetchDiscussionsPlatformState,
  fetchForumsPlatformState,
  fetchPostsPlatformState,
  markContentSyncSettled,
  mergeCommentsState,
  mergeDiscussionsState,
  mergeForumsState,
  mergePostsState,
} from "@/lib/content-sync";
import {
  applyCommentsPersistState,
  buildCommentsPersistState,
  syncCommentsToServer,
} from "@/lib/mock-comments";
import {
  applyDiscussionsPersistState,
  buildDiscussionsPersistState,
  syncDiscussionsToServer,
} from "@/lib/discussions-store";
import {
  applyForumsPersistState,
  buildForumsPersistState,
  syncForumsToServer,
} from "@/lib/forums-store";
import {
  applyPostsPersistState,
  buildPostsPersistState,
  syncPostsToServer,
} from "@/lib/posts-store";

/**
 * Loads live posts, RPG topics, comments, and discussions from Supabase on every visit.
 * When signed in, merges this browser's local drafts and pushes back to the server.
 */
export function ContentHydrator() {
  const { isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    void (async () => {
      const [remotePosts, remoteForums, remoteComments, remoteDiscussions] =
        await Promise.all([
          fetchPostsPlatformState(),
          fetchForumsPlatformState(),
          fetchCommentsPlatformState(),
          fetchDiscussionsPlatformState(),
        ]);
      if (cancelled) return;

      if (remotePosts) {
        const local = buildPostsPersistState();
        applyPostsPersistState(mergePostsState(local, remotePosts));
      }

      if (remoteForums) {
        const local = buildForumsPersistState();
        applyForumsPersistState(mergeForumsState(local, remoteForums));
      }

      if (remoteComments) {
        const local = buildCommentsPersistState();
        applyCommentsPersistState(mergeCommentsState(local, remoteComments));
      }

      if (remoteDiscussions) {
        const local = buildDiscussionsPersistState();
        applyDiscussionsPersistState(mergeDiscussionsState(local, remoteDiscussions));
      }

      if (isLoggedIn) {
        await Promise.all([
          syncPostsToServer(),
          syncForumsToServer(),
          syncCommentsToServer(),
          syncDiscussionsToServer(),
        ]);
      }

      if (!cancelled) {
        markContentSyncSettled();
        window.dispatchEvent(new Event(CONTENT_SYNCED_EVENT));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, loading]);

  return null;
}
