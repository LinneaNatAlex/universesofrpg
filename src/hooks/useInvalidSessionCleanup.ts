"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { useProfileDbUsername } from "@/hooks/useProfileDbUsername";
import { needsProfileCompletion, resolvePublicUsername } from "@/lib/auth-profile";
import { createClient } from "@/lib/supabase/client";

/** Redirect incomplete OAuth signups — only sign out when the auth user no longer exists. */
export function useInvalidSessionCleanup() {
  const router = useRouter();
  const pathname = usePathname();
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

    if (needsProfileCompletion(metadata)) {
      if (!pathname.startsWith("/complete-profile")) {
        router.replace("/complete-profile?next=%2F");
      }
      return;
    }

    void (async () => {
      const supabase = createClient();
      const {
        data: { user: validated },
        error,
      } = await supabase.auth.getUser();

      if (error || !validated) {
        await supabase.auth.signOut();
        router.refresh();
      }
    })();
  }, [loading, profileLoading, isLoggedIn, user, dbUsername, router, pathname]);
}
