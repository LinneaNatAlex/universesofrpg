"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { hydrateSocialFromServer } from "@/lib/friend-sync";

/**
 * Loads friend requests + friend lists from Supabase on every visit.
 * When signed in, merges this browser's local state and pushes back to the server.
 */
export function FriendsHydrator() {
  const { isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    const run = async () => {
      await hydrateSocialFromServer({ pushIfLoggedIn: isLoggedIn });
    };

    void run();

    const onVisible = () => {
      if (document.visibilityState !== "visible" || cancelled) return;
      void hydrateSocialFromServer({ pushIfLoggedIn: isLoggedIn });
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [isLoggedIn, loading]);

  return null;
}
