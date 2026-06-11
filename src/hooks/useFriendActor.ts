"use client";

import { useActingIdentity } from "@/hooks/useActingIdentity";

/** Who sends / receives friend requests right now (persona when admin, else account). */
export function useFriendActor() {
  const identity = useActingIdentity();

  if (!identity) return null;

  return {
    username: identity.username.toLowerCase(),
    displayName: identity.displayName,
    isActingAsPersona: identity.isActingAsPersona,
  };
}
