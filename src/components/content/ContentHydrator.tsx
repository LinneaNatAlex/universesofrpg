"use client";

import { useEffect, useRef } from "react";
import {
  CONTENT_SYNCED_EVENT,
  fetchCommentsPlatformState,
  fetchDiscussionsPlatformState,
  fetchForumsPlatformState,
  fetchHomepageChatPlatformState,
  fetchPostsPlatformState,
  markContentSyncSettled,
  mergeCommentsState,
  mergeDiscussionsState,
  mergeForumsState,
  mergeHomepageChatState,
  mergePostsState,
} from "@/lib/content-sync";
import {
  applyCommentsPersistState,
  buildCommentsPersistState,
} from "@/lib/mock-comments";
import {
  applyHomepageChatPersistState,
  buildHomepageChatPersistState,
} from "@/lib/homepage-chat-store";
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
      const [remotePosts, remoteForums, remoteComments, remoteDiscussions, remoteHomepageChat] =
        await Promise.all([
          fetchPostsPlatformState(),
          fetchForumsPlatformState(),
          fetchCommentsPlatformState(),
          fetchDiscussionsPlatformState(),
          fetchHomepageChatPlatformState(),
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

      if (remoteHomepageChat) {
        const local = buildHomepageChatPersistState();
        applyHomepageChatPersistState(mergeHomepageChatState(local, remoteHomepageChat));
      }

      notifyContentReady();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
