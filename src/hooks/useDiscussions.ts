"use client";

import { useEffect, useState } from "react";
import {
  getAllDiscussionThreads,
  subscribeDiscussions,
} from "@/lib/discussions-store";
import type { DiscussionThread } from "@/types/database";

export function useDiscussions(): DiscussionThread[] {
  const [threads, setThreads] = useState<DiscussionThread[]>(() =>
    getAllDiscussionThreads()
  );

  useEffect(() => {
    const refresh = () => setThreads(getAllDiscussionThreads());
    refresh();
    return subscribeDiscussions(refresh);
  }, []);

  return threads;
}
