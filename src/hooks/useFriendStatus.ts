"use client";

import { useEffect, useState } from "react";
import {
  getFriendRelationship,
  subscribeFriendRequests,
  type FriendRelationship,
} from "@/lib/friend-requests-store";
import { FRIENDS_SYNCED_EVENT } from "@/lib/friend-sync";
import { subscribeFriends } from "@/lib/friends-store";

export function useFriendStatus(
  viewerUsername: string | null,
  targetUsername: string
): FriendRelationship {
  const [status, setStatus] = useState<FriendRelationship>("none");

  useEffect(() => {
    if (!viewerUsername) {
      setStatus("none");
      return;
    }
    const refresh = () => {
      const next = getFriendRelationship(viewerUsername, targetUsername);
      setStatus((prev) => (prev === next ? prev : next));
    };
    refresh();
    const unsubFriends = subscribeFriends(refresh);
    const unsubRequests = subscribeFriendRequests(refresh);
    const onSynced = () => refresh();
    window.addEventListener(FRIENDS_SYNCED_EVENT, onSynced);
    return () => {
      unsubFriends();
      unsubRequests();
      window.removeEventListener(FRIENDS_SYNCED_EVENT, onSynced);
    };
  }, [viewerUsername, targetUsername]);

  return status;
}
