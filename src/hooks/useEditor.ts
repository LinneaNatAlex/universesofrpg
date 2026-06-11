"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { canReviewPaidContent } from "@/lib/editor-constants";
import {
  getEditorProfile,
  subscribeEditorProfiles,
} from "@/lib/editor-profiles-store";
import type { EditorLevel, EditorProfile } from "@/types/database";

export function useEditor() {
  const { isLoggedIn, user } = useAdmin();
  const identity = useActingIdentity();
  const [profile, setProfile] = useState<EditorProfile | null | undefined>(undefined);

  const username = identity?.username ?? user?.email?.split("@")[0] ?? null;

  useEffect(() => {
    if (!username) {
      setProfile(null);
      return;
    }
    const refresh = () => setProfile(getEditorProfile(username) ?? null);
    refresh();
    return subscribeEditorProfiles(refresh);
  }, [username]);

  const ready = profile !== undefined;
  const editorProfile = profile ?? null;
  const level: EditorLevel | null = editorProfile?.level ?? null;
  const isEditor = isLoggedIn && ready && !!editorProfile;

  return {
    isEditor,
    ready,
    profile: editorProfile,
    level,
    canReviewPaid: level ? canReviewPaidContent(level) : false,
    username,
    displayName: identity?.displayName ?? editorProfile?.display_name ?? null,
  };
}
