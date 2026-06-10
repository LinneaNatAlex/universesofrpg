"use client";

import { useAdmin } from "@/hooks/useAdmin";
import { usePersona } from "@/contexts/PersonaContext";
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

  if (!isLoggedIn || !user) return null;

  if (isAdmin && canSwitch && activePersona) {
    return {
      authorId: activePersona.id,
      username: activePersona.username,
      displayName: activePersona.display_name,
      profile: activePersona,
      isActingAsPersona: true,
    };
  }

  const username =
    (user.user_metadata?.username as string | undefined) ??
    user.email?.split("@")[0] ??
    "adventurer";
  const displayName =
    (user.user_metadata?.display_name as string | undefined) ?? username;

  const profile: Profile = {
    id: user.id,
    username,
    display_name: displayName,
    bio: null,
    avatar_url: null,
    banner_url: null,
    persona_mode: true,
    is_verified_creator: false,
    created_at: new Date().toISOString(),
  };

  return {
    authorId: user.id,
    username,
    displayName,
    profile,
    isActingAsPersona: false,
  };
}
