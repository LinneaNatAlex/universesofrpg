"use client";

import { useEffect, useState } from "react";
import {
  showsFriendsList,
  subscribeCreatorPreferences,
} from "@/lib/creator-preferences-store";

export function useProfilePrivacy(username: string) {
  const [showFriendsList, setShowFriendsList] = useState<boolean | null>(null);

  useEffect(() => {
    const refresh = () => setShowFriendsList(showsFriendsList(username));
    refresh();
    return subscribeCreatorPreferences(refresh);
  }, [username]);

  return {
    ready: showFriendsList !== null,
    showFriendsList: showFriendsList ?? true,
  };
}
