"use client";

import { useCallback, useEffect, useState } from "react";
import {
  followCreator,
  isFollowingCreator,
  subscribeCreatorFollows,
  unfollowCreator,
} from "@/lib/creator-follows-store";

export function useCreatorFollow(
  username: string | null,
  creatorUsername: string,
  creatorDisplayName: string
) {
  const [following, setFollowing] = useState(() =>
    username ? isFollowingCreator(username, creatorUsername) : false
  );

  useEffect(() => {
    if (!username) {
      setFollowing(false);
      return;
    }
    const refresh = () =>
      setFollowing(isFollowingCreator(username, creatorUsername));
    refresh();
    return subscribeCreatorFollows(refresh);
  }, [username, creatorUsername]);

  const toggle = useCallback(() => {
    if (!username) return;
    if (following) {
      unfollowCreator(username, creatorUsername);
    } else {
      followCreator(username, creatorUsername, creatorDisplayName);
    }
  }, [username, creatorUsername, creatorDisplayName, following]);

  return { following, toggle };
}
