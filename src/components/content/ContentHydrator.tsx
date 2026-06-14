"use client";

import { useEffect, useRef } from "react";
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
} from "@/lib/mock-comments";
import {
  applyDiscussionsPersistState,
  buildDiscussionsPersistState,
} from "@/lib/discussions-store";
import {
  applyForumsPersistState,
  buildForumsPersistState,
} from "@/lib/forums-store";
import {
  applyPostsPersistState,
  buildPostsPersistState,
} from "@/lib/posts-store";

function notifyContentReady(): void {
  markContentSyncSettled();
  window.dispatchEvent(new Event(CONTENT_SYNCED_EVENT));
}

/**
 * Shows cached/mock content immediately and pulls live data in the background.
 * Writes are pushed when the user edits — not on every page load.
 */
export function ContentHydrator() {
  const settledRef = useRef(false);

  useEffect(() => {
    if (!settledRef.current) {
      settledRef.current = true;
      notifyContentReady();
    }
  }, []);

  useEffect(() => {
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

      notifyContentReady();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
