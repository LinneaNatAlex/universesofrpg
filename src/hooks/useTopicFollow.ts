"use client";

import { useCallback, useEffect, useState } from "react";
import {
  followTopic,
  isFollowingTopic,
  subscribeTopicFollows,
  unfollowTopic,
} from "@/lib/topic-follows-store";

export function useTopicFollow(username: string | null, forumId: string) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!username) {
      setFollowing(false);
      return;
    }
    const refresh = () => setFollowing(isFollowingTopic(username, forumId));
    refresh();
    return subscribeTopicFollows(refresh);
  }, [username, forumId]);

  const toggle = useCallback(() => {
    if (!username) return;
    if (following) {
      unfollowTopic(username, forumId);
    } else {
      followTopic(username, forumId);
    }
  }, [username, forumId, following]);

  return { following, toggle };
}
