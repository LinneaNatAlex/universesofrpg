"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getProfileAvatarUrl, setProfileAvatarUrl } from "@/lib/profile-avatars-store";

/** Username from public.profiles for the signed-in user. */
export function useProfileDbUsername(userId: string | undefined, enabled: boolean): string | null {
  const [dbUsername, setDbUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId || !isSupabaseConfigured()) {
      setDbUsername(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", userId)
          .maybeSingle();

        if (cancelled || error || !data?.username) return;

        const username = data.username.toLowerCase();
        setDbUsername(username);

        const remote = data.avatar_url?.trim() || null;
        if (remote && !getProfileAvatarUrl(username)) {
          setProfileAvatarUrl(username, remote);
        }
      } catch {
        // profiles row may not exist yet
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, userId]);

  return dbUsername;
}
