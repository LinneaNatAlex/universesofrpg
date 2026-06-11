"use client";

import { useEffect, useMemo } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useProfileAvatar } from "@/hooks/useProfileAvatar";
import { registerKnownUser } from "@/lib/known-users-store";
import type { Profile } from "@/types/database";

export interface AccountIdentity {
  authorId: string;
  username: string;
  displayName: string;
  profile: Profile;
}

/** Always the signed-in user — never an admin demo persona. */
export function useAccountIdentity(): AccountIdentity | null {
  const { user, isLoggedIn } = useAdmin();

  const base = useMemo((): Omit<AccountIdentity, "profile"> & { profile: Omit<Profile, "avatar_url"> } | null => {
    if (!isLoggedIn || !user) return null;

    const rawUsername =
      (user.user_metadata?.username as string | undefined) ??
      user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "_") ??
      "adventurer";
    const username = rawUsername.toLowerCase();
    const displayName =
      (user.user_metadata?.display_name as string | undefined) ?? username;

    return {
      authorId: user.id,
      username,
      displayName,
      profile: {
        id: user.id,
        username,
        display_name: displayName,
        bio: null,
        banner_url: null,
        persona_mode: true,
        is_verified_creator: false,
        created_at: user.created_at ?? "",
      },
    };
  }, [isLoggedIn, user]);

  const avatarUrl = useProfileAvatar(base?.username ?? null);

  const identity = useMemo((): AccountIdentity | null => {
    if (!base) return null;
    return {
      ...base,
      profile: {
        ...base.profile,
        avatar_url: avatarUrl,
      },
    };
  }, [base, avatarUrl]);

  useEffect(() => {
    if (!identity) return;
    registerKnownUser({
      username: identity.username,
      display_name: identity.displayName,
    });
  }, [identity?.username, identity?.displayName]);

  return identity;
}
