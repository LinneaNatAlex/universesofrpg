"use client";

import { useEffect, useState } from "react";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useVerifiedCreator } from "@/hooks/useVerifiedCreator";
import {
  acceptsFriendRequests,
  setAcceptFriendRequests,
  setShowFollowButton,
  showsFollowButton,
  subscribeCreatorPreferences,
} from "@/lib/creator-preferences-store";

export function VerifiedCreatorSettings() {
  const identity = useActingIdentity();
  const username = identity?.username ?? null;
  const isVerified = useVerifiedCreator(username);
  const [acceptRequests, setAcceptRequests] = useState(true);
  const [showFollow, setShowFollow] = useState(true);
  const [prefsReady, setPrefsReady] = useState(false);

  useEffect(() => {
    if (!username || isVerified !== true) {
      setPrefsReady(false);
      return;
    }
    const refresh = () => {
      setAcceptRequests(acceptsFriendRequests(username));
      setShowFollow(showsFollowButton(username));
      setPrefsReady(true);
    };
    refresh();
    return subscribeCreatorPreferences(refresh);
  }, [username, isVerified]);

  if (!username || isVerified !== true || !prefsReady) return null;

  return (
    <div className="border-t-4 border-dashed border-ink pt-6 space-y-3">
      <h3 className="font-comic text-lg text-ink">Verified creator</h3>
      <label className="flex items-start gap-3 comic-panel p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={showFollow}
          onChange={(e) => {
            setShowFollowButton(username, e.target.checked);
            setShowFollow(e.target.checked);
          }}
          className="mt-1"
        />
        <span>
          <span className="font-comic text-sm text-ink block">Show Follow button on my profile</span>
          <span className="text-xs text-ink-muted mt-1 block">
            When off, others won&apos;t see Follow on your profile. People you already follow are
            unaffected.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 comic-panel p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={acceptRequests}
          onChange={(e) => {
            setAcceptFriendRequests(username, e.target.checked);
            setAcceptRequests(e.target.checked);
          }}
          className="mt-1"
        />
        <span>
          <span className="font-comic text-sm text-ink block">Accept friend requests</span>
          <span className="text-xs text-ink-muted mt-1 block">
            Turn off to hide Become friends on your profile. Existing friends stay connected.
          </span>
        </span>
      </label>
    </div>
  );
}
