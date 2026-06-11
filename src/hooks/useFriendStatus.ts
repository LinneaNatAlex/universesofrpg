"use client";

import { useEffect, useState } from "react";
import {
  getFriendRelationship,
  subscribeFriendRequests,
  type FriendRelationship,
} from "@/lib/friend-requests-store";
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
    return () => {
      unsubFriends();
      unsubRequests();
    };
  }, [viewerUsername, targetUsername]);

  return status;
}
