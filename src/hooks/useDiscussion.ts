"use client";

import { useEffect, useState } from "react";
import {
  getDiscussionThread,
  subscribeDiscussions,
} from "@/lib/discussions-store";
import type { DiscussionThread } from "@/types/database";

export function useDiscussion(id: string): DiscussionThread | undefined | null {
  const [thread, setThread] = useState<DiscussionThread | undefined | null>(undefined);

  useEffect(() => {
    const refresh = () => setThread(getDiscussionThread(id) ?? null);
    refresh();
    return subscribeDiscussions(refresh);
  }, [id]);

  return thread;
}
