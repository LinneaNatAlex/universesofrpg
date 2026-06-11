"use client";

import { useEffect, useState } from "react";
import { getFriends, subscribeFriends } from "@/lib/friends-store";
import type { FriendLink } from "@/types/database";

export function useFriends(ownerUsername: string | null): FriendLink[] {
  const [friends, setFriends] = useState<FriendLink[]>([]);

  useEffect(() => {
    if (!ownerUsername) {
      setFriends([]);
      return;
    }
    const refresh = () => {
      const next = getFriends(ownerUsername);
      setFriends((prev) => {
        if (
          prev.length === next.length &&
          prev.every((f, i) => f.username === next[i]?.username)
        ) {
          return prev;
        }
        return next;
      });
    };
    refresh();
    return subscribeFriends(refresh);
  }, [ownerUsername]);

  return friends;
}
