"use client";

import { useEffect, useState } from "react";
import {
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  subscribeFriendRequests,
} from "@/lib/friend-requests-store";
import type { FriendRequest } from "@/types/database";

export function useFriendRequests(username: string | null) {
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);

  useEffect(() => {
    if (!username) {
      setIncoming([]);
      setOutgoing([]);
      return;
    }
    const refresh = () => {
      setIncoming(getIncomingFriendRequests(username));
      setOutgoing(getOutgoingFriendRequests(username));
    };
    refresh();
    return subscribeFriendRequests(refresh);
  }, [username]);

  return { incoming, outgoing };
}
