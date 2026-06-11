"use client";

import { useMemo } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { usePersona } from "@/contexts/PersonaContext";
import { useProfileAvatar } from "@/hooks/useProfileAvatar";
import type { Profile } from "@/types/database";

export interface ActingIdentity {
  authorId: string;
  username: string;
  displayName: string;
  profile: Profile | null;
  /** Admin posting as a demo creator */
  isActingAsPersona: boolean;
}

export function useActingIdentity(): ActingIdentity | null {
  const { user, isLoggedIn, isAdmin } = useAdmin();
  const { activePersona, canSwitch } = usePersona();

  const actingUsername = useMemo(() => {
    if (!isLoggedIn || !user) return null;
    if (isAdmin && canSwitch && activePersona) {
      return activePersona.username.toLowerCase();
    }
    const rawUsername =
      (user.user_metadata?.username as string | undefined) ??
      user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "_") ??
      "adventurer";
    return rawUsername.toLowerCase();
  }, [isLoggedIn, user, isAdmin, canSwitch, activePersona]);

  const avatarUrl = useProfileAvatar(actingUsername);

  return useMemo((): ActingIdentity | null => {
    if (!isLoggedIn || !user || !actingUsername) return null;

    if (isAdmin && canSwitch && activePersona) {
      return {
        authorId: activePersona.id,
        username: actingUsername,
        displayName: activePersona.display_name,
        profile: {
          ...activePersona,
          avatar_url: avatarUrl ?? activePersona.avatar_url,
        },
        isActingAsPersona: true,
      };
    }

    const displayName =
      (user.user_metadata?.display_name as string | undefined) ?? actingUsername;

    const profile: Profile = {
      id: user.id,
      username: actingUsername,
      display_name: displayName,
      bio: null,
      avatar_url: avatarUrl,
      banner_url: null,
      persona_mode: true,
      is_verified_creator: false,
      created_at: new Date().toISOString(),
    };

    return {
      authorId: user.id,
      username: actingUsername,
      displayName,
      profile,
      isActingAsPersona: false,
    };
  }, [
    isLoggedIn,
    user,
    actingUsername,
    avatarUrl,
    isAdmin,
    canSwitch,
    activePersona,
  ]);
}
