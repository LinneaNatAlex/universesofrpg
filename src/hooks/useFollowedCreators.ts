"use client";

import { useEffect, useState } from "react";
import {
  getFollowedCreators,
  subscribeCreatorFollows,
  type CreatorFollow,
} from "@/lib/creator-follows-store";

export function useFollowedCreators(username: string | null): CreatorFollow[] {
  const [creators, setCreators] = useState<CreatorFollow[]>([]);

  useEffect(() => {
    if (!username) {
      setCreators([]);
      return;
    }
    const refresh = () => setCreators(getFollowedCreators(username));
    refresh();
    return subscribeCreatorFollows(refresh);
  }, [username]);

  return creators;
}
