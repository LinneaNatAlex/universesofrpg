"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { useProfileDbUsername } from "@/hooks/useProfileDbUsername";
import { resolvePublicUsername } from "@/lib/auth-profile";
import { createClient } from "@/lib/supabase/client";

/** Sign out stale sessions with no real profile (e.g. deleted account, ghost JWT). */
export function useInvalidSessionCleanup() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAdmin();
  const { username: dbUsername, loading: profileLoading } = useProfileDbUsername(
    user?.id,
    isLoggedIn
  );

  useEffect(() => {
    if (loading || profileLoading || !isLoggedIn || !user) return;

    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const resolved = resolvePublicUsername(metadata, dbUsername);
    if (resolved) return;

    void (async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
    })();
  }, [loading, profileLoading, isLoggedIn, user, dbUsername, router]);
}
