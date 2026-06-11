"use client";

import { useEffect, useState } from "react";
import {
  getProfileAvatarUrl,
  setProfileAvatarUrl,
  subscribeProfileAvatars,
} from "@/lib/profile-avatars-store";

export const PROFILE_AVATAR_UPDATED_EVENT = "uorpg-profile-avatar-updated";

export function useProfileAvatar(username: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    username ? getProfileAvatarUrl(username) : null
  );

  useEffect(() => {
    if (!username) {
      setUrl(null);
      return;
    }

    const key = username;

    const refreshLocal = () => {
      setUrl(getProfileAvatarUrl(key));
    };

    refreshLocal();
    const unsub = subscribeProfileAvatars(refreshLocal);

    let cancelled = false;

    async function syncFromServer() {
      try {
        const res = await fetch(
          `/api/profile/avatar?username=${encodeURIComponent(key)}`,
          { cache: "no-store" }
        );
        if (!res.ok || cancelled) return;

        const data = (await res.json()) as { avatar_url?: string | null };
        const remote = data.avatar_url?.trim() || null;
        const local = getProfileAvatarUrl(key);

        if (remote && remote !== local) {
          setProfileAvatarUrl(key, remote);
        }

        setUrl(getProfileAvatarUrl(key) ?? remote);
      } catch {
        // offline — keep local cache
      }
    }

    void syncFromServer();

    const onUpdated = () => void syncFromServer();
    window.addEventListener(PROFILE_AVATAR_UPDATED_EVENT, onUpdated);

    return () => {
      cancelled = true;
      unsub();
      window.removeEventListener(PROFILE_AVATAR_UPDATED_EVENT, onUpdated);
    };
  }, [username]);

  return url;
}
