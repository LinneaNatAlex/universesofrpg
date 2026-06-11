"use client";

import { useEffect, useState } from "react";
import {
  getCreatorFollowerCount,
  subscribeCreatorFollows,
} from "@/lib/creator-follows-store";

export function useCreatorFollowerCount(creatorUsername: string): number {
  const [count, setCount] = useState(() => getCreatorFollowerCount(creatorUsername));

  useEffect(() => {
    const refresh = () => setCount(getCreatorFollowerCount(creatorUsername));
    refresh();
    return subscribeCreatorFollows(refresh);
  }, [creatorUsername]);

  return count;
}
