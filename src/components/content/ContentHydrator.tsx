"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  CONTENT_SYNCED_EVENT,
  fetchForumsPlatformState,
  fetchPostsPlatformState,
  markContentSyncSettled,
  mergeForumsState,
  mergePostsState,
} from "@/lib/content-sync";
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
 * Loads live posts + RPG topics from Supabase on every visit.
 * When signed in, merges this browser's local drafts and pushes back to the server.
 */
export function ContentHydrator() {
  const { isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    void (async () => {
      const [remotePosts, remoteForums] = await Promise.all([
        fetchPostsPlatformState(),
        fetchForumsPlatformState(),
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

      if (isLoggedIn) {
        await Promise.all([syncPostsToServer(), syncForumsToServer()]);
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
