"use client";

import { useEffect, useState } from "react";
import { useFriendActor } from "@/hooks/useFriendActor";
import {
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  subscribeFriendRequests,
} from "@/lib/friend-requests-store";
import { getFriends, subscribeFriends } from "@/lib/friends-store";
import type { FriendLink, FriendRequest } from "@/types/database";

function sameRequests(a: FriendRequest[], b: FriendRequest[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, i) => item.id === b[i]?.id && item.status === b[i]?.status);
}

function sameFriends(a: FriendLink[], b: FriendLink[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, i) => item.username === b[i]?.username);
}

/** Inbox for the currently active user / persona only. */
export function useFriendInbox() {
  const actor = useFriendActor();
  const actorUsername = actor?.username ?? null;

  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendLink[]>([]);

  useEffect(() => {
    if (!actorUsername) {
      setIncoming((prev) => (prev.length === 0 ? prev : []));
      setOutgoing((prev) => (prev.length === 0 ? prev : []));
      setFriends((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const refresh = () => {
      const nextIncoming = getIncomingFriendRequests(actorUsername);
      const nextOutgoing = getOutgoingFriendRequests(actorUsername);
      const nextFriends = getFriends(actorUsername);

      setIncoming((prev) => (sameRequests(prev, nextIncoming) ? prev : nextIncoming));
      setOutgoing((prev) => (sameRequests(prev, nextOutgoing) ? prev : nextOutgoing));
      setFriends((prev) => (sameFriends(prev, nextFriends) ? prev : nextFriends));
    };

    refresh();
    const unsubRequests = subscribeFriendRequests(refresh);
    const unsubFriends = subscribeFriends(refresh);
    return () => {
      unsubRequests();
      unsubFriends();
    };
  }, [actorUsername]);

  return {
    actor,
    incoming,
    outgoing,
    friends,
  };
}
