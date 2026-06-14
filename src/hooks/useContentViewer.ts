"use client";

import { useMemo } from "react";
import { useAccountAge } from "@/hooks/useAccountAge";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useEditor } from "@/hooks/useEditor";
import { buildContentViewerContext } from "@/lib/content-rating";

export function useContentViewer() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { age, loading: ageLoading } = useAccountAge();
  const identity = useActingIdentity();
  const { isEditor } = useEditor();

  const ctx = useMemo(
    () =>
      buildContentViewerContext({
        isLoggedIn,
        userAge: age,
        username: identity?.username ?? null,
        isEditor,
      }),
    [isLoggedIn, age, identity?.username, isEditor]
  );

  return {
    ctx,
    loading: authLoading || ageLoading,
  };
}
