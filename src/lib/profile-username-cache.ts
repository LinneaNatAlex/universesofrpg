import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getProfileAvatarUrl, setProfileAvatarUrl } from "@/lib/profile-avatars-store";

type CacheEntry = {
  username: string | null;
  loading: boolean;
  promise: Promise<string | null> | null;
};

const cache = new Map<string, CacheEntry>();

function getEntry(userId: string): CacheEntry {
  let entry = cache.get(userId);
  if (!entry) {
    entry = { username: null, loading: false, promise: null };
    cache.set(userId, entry);
  }
  return entry;
}

export function readCachedProfileUsername(userId: string | undefined): {
  username: string | null;
  loading: boolean;
} {
  if (!userId) return { username: null, loading: false };
  const entry = cache.get(userId);
  if (!entry) return { username: null, loading: false };
  return { username: entry.username, loading: entry.loading };
}

export function fetchProfileUsernameCached(userId: string): Promise<string | null> {
  const entry = getEntry(userId);
  if (entry.promise) return entry.promise;
  if (entry.username !== null) return Promise.resolve(entry.username);

  entry.loading = true;
  entry.promise = (async () => {
    if (!isSupabaseConfigured()) return null;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data?.username) {
        entry.username = null;
        return null;
      }

      const resolved = data.username.toLowerCase();
      entry.username = resolved;

      const remote = data.avatar_url?.trim() || null;
      if (remote && !getProfileAvatarUrl(resolved)) {
        setProfileAvatarUrl(resolved, remote);
      }

      return resolved;
    } catch {
      entry.username = null;
      return null;
    } finally {
      entry.loading = false;
      entry.promise = null;
    }
  })();

  return entry.promise;
}

export function clearProfileUsernameCache(userId?: string): void {
  if (userId) {
    cache.delete(userId);
    return;
  }
  cache.clear();
}
