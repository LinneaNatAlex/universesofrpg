"use client";

import { useEffect, useState } from "react";
import {
  getDiscussionReplies,
  subscribeDiscussions,
} from "@/lib/discussions-store";
import type { DiscussionReply } from "@/types/database";

export function useDiscussionReplies(threadId: string): DiscussionReply[] {
  const [items, setItems] = useState<DiscussionReply[]>(() =>
    getDiscussionReplies(threadId)
  );

  useEffect(() => {
    const refresh = () => setItems(getDiscussionReplies(threadId));
    refresh();
    return subscribeDiscussions(refresh);
  }, [threadId]);

  return items;
}
