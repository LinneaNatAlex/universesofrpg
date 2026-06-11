"use client";

import { useEffect, useState } from "react";
import {
  CONTENT_SYNCED_EVENT,
  isContentSyncSettled,
} from "@/lib/content-sync";
import { getPostById } from "@/lib/posts";
import { subscribePosts } from "@/lib/posts-store";
import type { FeedPost } from "@/types/database";

const SYNC_WAIT_MS = 12_000;

export function usePost(id: string): FeedPost | undefined | null {
  const [post, setPost] = useState<FeedPost | undefined | null>(undefined);
  const [syncSettled, setSyncSettled] = useState(() => isContentSyncSettled());

  useEffect(() => {
    const refresh = () => {
      const found = getPostById(id);
      if (found) {
        setPost(found);
        setSyncSettled(true);
        return;
      }
      setPost(null);
    };

    refresh();

    const onSynced = () => {
      setSyncSettled(true);
      refresh();
    };

    window.addEventListener(CONTENT_SYNCED_EVENT, onSynced);
    const unsubPosts = subscribePosts(refresh);

    const timeout = window.setTimeout(() => setSyncSettled(true), SYNC_WAIT_MS);

    return () => {
      window.removeEventListener(CONTENT_SYNCED_EVENT, onSynced);
      unsubPosts();
      window.clearTimeout(timeout);
    };
  }, [id]);

  if (post === undefined) return undefined;
  if (post === null && !syncSettled) return undefined;
  return post;
}
