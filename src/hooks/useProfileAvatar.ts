"use client";

import { useEffect, useState } from "react";
import {
  getProfileAvatarUrl,
  subscribeProfileAvatars,
} from "@/lib/profile-avatars-store";

export function useProfileAvatar(username: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setUrl(null);
      return;
    }
    const refresh = () => setUrl(getProfileAvatarUrl(username));
    refresh();
    return subscribeProfileAvatars(refresh);
  }, [username]);

  return url;
}
