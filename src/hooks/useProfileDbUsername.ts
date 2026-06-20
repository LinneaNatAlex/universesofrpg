"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  fetchProfileUsernameCached,
  readCachedProfileUsername,
} from "@/lib/profile-username-cache";

export interface ProfileDbRecord {
  username: string | null;
  loading: boolean;
}

/** Username from public.profiles for the signed-in user. */
export function useProfileDbUsername(userId: string | undefined, enabled: boolean): ProfileDbRecord {
  const cached = readCachedProfileUsername(enabled ? userId : undefined);
  const [username, setUsername] = useState<string | null>(cached.username);
  const [loading, setLoading] = useState(cached.loading);

  useEffect(() => {
    if (!enabled || !userId || !isSupabaseConfigured()) {
      setUsername(null);
      setLoading(false);
      return;
    }

    const snapshot = readCachedProfileUsername(userId);
    if (snapshot.username !== null) {
      setUsername(snapshot.username);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetchProfileUsernameCached(userId).then((resolved) => {
      if (cancelled) return;
      setUsername(resolved);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, userId]);

  return { username, loading };
}
