"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    async function syncUser() {
      const {
        data: { user: validated },
        error,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (error || !validated) {
        const stillHasSession = (await supabase.auth.getSession()).data.session;
        if (stillHasSession) {
          await supabase.auth.signOut();
        }
        setUser(null);
      } else {
        setUser(validated);
      }
      setLoading(false);
    }

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        return;
      }
      void syncUser();
    });

    function onVisible() {
      if (document.visibilityState === "visible") {
        void syncUser();
      }
    }

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return { user, loading, isLoggedIn: !!user };
}
