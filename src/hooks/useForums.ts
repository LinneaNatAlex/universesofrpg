"use client";

import { useEffect, useState } from "react";
import { CONTENT_SYNCED_EVENT } from "@/lib/content-sync";
import { subscribeDevStore } from "@/lib/dev-store-notify";
import {
  getAllForums,
  getForumById,
  subscribeForums,
} from "@/lib/forums-store";
import type { RpgForum } from "@/types/database";

export function useForums(): RpgForum[] {
  const [forums, setForums] = useState<RpgForum[]>(() => getAllForums());

  useEffect(() => {
    const refresh = () => setForums(getAllForums());
    refresh();
    const onSynced = () => refresh();
    window.addEventListener(CONTENT_SYNCED_EVENT, onSynced);
    const unsubStore = subscribeForums(refresh);
    const unsubHotReload = subscribeDevStore("forums", refresh);
    return () => {
      window.removeEventListener(CONTENT_SYNCED_EVENT, onSynced);
      unsubStore();
      unsubHotReload();
    };
  }, []);

  return forums;
}

export function useForum(forumId: string): RpgForum | undefined {
  const [forum, setForum] = useState<RpgForum | undefined>(() => getForumById(forumId));

  useEffect(() => {
    const refresh = () => setForum(getForumById(forumId));
    refresh();
    const onSynced = () => refresh();
    window.addEventListener(CONTENT_SYNCED_EVENT, onSynced);
    const unsubStore = subscribeForums(refresh);
    const unsubHotReload = subscribeDevStore("forums", refresh);
    return () => {
      window.removeEventListener(CONTENT_SYNCED_EVENT, onSynced);
      unsubStore();
      unsubHotReload();
    };
  }, [forumId]);

  return forum;
}
