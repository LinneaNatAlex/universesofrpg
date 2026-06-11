"use client";

import { useEffect, useState } from "react";
import { useAccountIdentity } from "@/hooks/useAccountIdentity";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import {
  setShowFriendsList,
  showsFriendsList,
  subscribeCreatorPreferences,
} from "@/lib/creator-preferences-store";

export function ProfilePrivacySettings() {
  const identity = useActingIdentity();
  const account = useAccountIdentity();
  const username = account?.username ?? identity?.username ?? null;
  const [showFriends, setShowFriends] = useState(true);
  const [prefsReady, setPrefsReady] = useState(false);

  useEffect(() => {
    if (!username) {
      setPrefsReady(false);
      return;
    }
    const refresh = () => {
      setShowFriends(showsFriendsList(username));
      setPrefsReady(true);
    };
    refresh();
    return subscribeCreatorPreferences(refresh);
  }, [username]);

  if (!username || !prefsReady) return null;

  return (
    <div className="border-t-4 border-dashed border-ink pt-6 space-y-3">
      <h3 className="font-comic text-lg text-ink">Profile privacy</h3>
      <label className="flex items-start gap-3 comic-panel p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={showFriends}
          onChange={(e) => {
            setShowFriendsList(username, e.target.checked);
            setShowFriends(e.target.checked);
          }}
          className="mt-1"
        />
        <span>
          <span className="font-comic text-sm text-ink block">Show friends list on my profile</span>
          <span className="text-xs text-ink-muted mt-1 block">
            When off, only you see the Friends tab — other visitors won&apos;t see who you&apos;re
            friends with.
          </span>
        </span>
      </label>
    </div>
  );
}
