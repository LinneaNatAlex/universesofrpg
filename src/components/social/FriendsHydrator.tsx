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

    const timer = window.setTimeout(() => {
      if (!cancelled) void run();
    }, 1_500);

    const onVisible = () => {
      if (document.visibilityState !== "visible" || cancelled) return;
      void hydrateSocialFromServer({ pushIfLoggedIn: isLoggedIn });
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isLoggedIn, loading]);

  return null;
}
