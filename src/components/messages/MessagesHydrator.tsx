"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { hydrateMessagesFromServer } from "@/lib/message-sync";

/** Loads private messages from Supabase and keeps them in sync. */
export function MessagesHydrator() {
  const { isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    const run = async () => {
      await hydrateMessagesFromServer({ pushIfLoggedIn: isLoggedIn });
    };

    const timer = window.setTimeout(() => {
      if (!cancelled) void run();
    }, 1_800);

    const onVisible = () => {
      if (document.visibilityState !== "visible" || cancelled) return;
      void hydrateMessagesFromServer({ pushIfLoggedIn: isLoggedIn });
    };

    document.addEventListener("visibilitychange", onVisible);

    const poll = window.setInterval(() => {
      if (document.visibilityState !== "visible" || cancelled) return;
      void hydrateMessagesFromServer({ pushIfLoggedIn: false });
    }, 12_000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isLoggedIn, loading]);

  return null;
}
