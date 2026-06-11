"use client";

import { useEffect, useState } from "react";
import {
  acceptsFriendRequests,
  showsFollowButton,
  subscribeCreatorPreferences,
} from "@/lib/creator-preferences-store";
import { useVerifiedCreator } from "@/hooks/useVerifiedCreator";

interface CreatorProfileActions {
  ready: boolean;
  showFollowButton: boolean;
  acceptFriendRequests: boolean;
}

export function useCreatorProfileActions(
  targetUsername: string
): CreatorProfileActions {
  const verified = useVerifiedCreator(targetUsername);
  const [prefs, setPrefs] = useState<{
    showFollowButton: boolean;
    acceptFriendRequests: boolean;
  } | null>(null);

  useEffect(() => {
    if (verified === null) return;

    if (!verified) {
      setPrefs({ showFollowButton: true, acceptFriendRequests: true });
      return;
    }

    const refresh = () =>
      setPrefs({
        showFollowButton: showsFollowButton(targetUsername),
        acceptFriendRequests: acceptsFriendRequests(targetUsername),
      });

    refresh();
    return subscribeCreatorPreferences(refresh);
  }, [targetUsername, verified]);

  return {
    ready: verified !== null && prefs !== null,
    showFollowButton: prefs?.showFollowButton ?? false,
    acceptFriendRequests: prefs?.acceptFriendRequests ?? true,
  };
}
