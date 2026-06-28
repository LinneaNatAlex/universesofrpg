"use client";

import { useEffect } from "react";
import {
  CONTENT_SYNCED_EVENT,
  markForumsHydrationComplete,
  markPostsHydrationComplete,
  markContentSyncSettled,
} from "@/lib/content-sync";
import {
  markDevHydrationCompleted,
  shouldSkipDevRehydration,
} from "@/lib/dev-hydration-guard";
import { hydratePlatformContent } from "@/lib/hydrate-platform-content";

const LIVE_POLL_MS =
  process.env.NODE_ENV === "development" ? 30_000 : 5_000;

function notifyContentReady(): void {
  markContentSyncSettled();
  window.dispatchEvent(new Event(CONTENT_SYNCED_EVENT));
}

/**
 * Loads cached content immediately, merges live server data, and keeps polling
 * so other users' posts/topics/discussions show up without a hard refresh.
 */
export function ContentHydrator() {
  useEffect(() => {
    if (shouldSkipDevRehydration()) {
      markForumsHydrationComplete();
      markPostsHydrationComplete();
      markContentSyncSettled();
      return;
    }

    let cancelled = false;

    const pull = async (notify: boolean) => {
      const updated = await hydratePlatformContent();
      if (cancelled) return;
      if (notify || updated) {
        notifyContentReady();
      }
      markForumsHydrationComplete();
      markPostsHydrationComplete();
      markDevHydrationCompleted();
    };

    void pull(true);

    const timer = setInterval(() => {
      if (cancelled || document.visibilityState !== "visible") return;
      void pull(false);
    }, LIVE_POLL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") {
        void pull(true);
      }
    }

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
