"use client";

import { useEffect, useState } from "react";
import { CONTENT_SYNCED_EVENT } from "@/lib/content-sync";
import {
  getAllForums,
  getForumById,
  reloadForumsFromStorage,
  subscribeForums,
} from "@/lib/forums-store";
import type { RpgForum } from "@/types/database";

export function useForums(): RpgForum[] {
  const [forums, setForums] = useState<RpgForum[]>(() => getAllForums());

  useEffect(() => {
    const refresh = () => setForums(getAllForums());

    const onSynced = () => {
      reloadForumsFromStorage();
      refresh();
    };

    refresh();
    const unsub = subscribeForums(refresh);
    window.addEventListener(CONTENT_SYNCED_EVENT, onSynced);
    return () => {
      unsub();
      window.removeEventListener(CONTENT_SYNCED_EVENT, onSynced);
    };
  }, []);

  return forums;
}

export function useForum(forumId: string): RpgForum | undefined {
  const [forum, setForum] = useState<RpgForum | undefined>(() => getForumById(forumId));

  useEffect(() => {
    const refresh = () => setForum(getForumById(forumId));

    const onSynced = () => {
      reloadForumsFromStorage();
      refresh();
    };

    refresh();
    const unsub = subscribeForums(refresh);
    window.addEventListener(CONTENT_SYNCED_EVENT, onSynced);
    return () => {
      unsub();
      window.removeEventListener(CONTENT_SYNCED_EVENT, onSynced);
    };
  }, [forumId]);

  return forum;
}
