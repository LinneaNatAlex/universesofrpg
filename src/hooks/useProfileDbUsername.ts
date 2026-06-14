"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getProfileAvatarUrl, setProfileAvatarUrl } from "@/lib/profile-avatars-store";

export interface ProfileDbRecord {
  username: string | null;
  loading: boolean;
}

/** Username from public.profiles for the signed-in user. */
export function useProfileDbUsername(userId: string | undefined, enabled: boolean): ProfileDbRecord {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !userId || !isSupabaseConfigured()) {
      setUsername(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", userId)
          .maybeSingle();

        if (cancelled) return;

        if (error || !data?.username) {
          setUsername(null);
          return;
        }

        const resolved = data.username.toLowerCase();
        setUsername(resolved);

        const remote = data.avatar_url?.trim() || null;
        if (remote && !getProfileAvatarUrl(resolved)) {
          setProfileAvatarUrl(resolved, remote);
        }
      } catch {
        if (!cancelled) setUsername(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, userId]);

  return { username, loading };
}
