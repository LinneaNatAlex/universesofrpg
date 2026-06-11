"use client";

import { useEffect, useState } from "react";
import { getFriends, subscribeFriends } from "@/lib/friends-store";
import { FRIENDS_SYNCED_EVENT } from "@/lib/friend-sync";
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
    const unsubFriends = subscribeFriends(refresh);
    const onSynced = () => refresh();
    window.addEventListener(FRIENDS_SYNCED_EVENT, onSynced);

    return () => {
      unsubFriends();
      window.removeEventListener(FRIENDS_SYNCED_EVENT, onSynced);
    };
  }, [ownerUsername]);

  return friends;
}
