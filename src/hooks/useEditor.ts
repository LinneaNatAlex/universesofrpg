"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAccountIdentity } from "@/hooks/useAccountIdentity";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { canReviewPaidContent } from "@/lib/editor-constants";
import {
  getEditorProfile,
  subscribeEditorProfiles,
} from "@/lib/editor-profiles-store";
import type { EditorLevel, EditorProfile } from "@/types/database";

export function useEditor() {
  const { isLoggedIn, user } = useAdmin();
  const account = useAccountIdentity();
  const identity = useActingIdentity();
  const [profile, setProfile] = useState<EditorProfile | null | undefined>(undefined);

  /** Editor licence is on the signed-in account — not admin demo personas. */
  const username =
    account?.username ??
    identity?.username ??
    user?.email?.split("@")[0] ??
    null;

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
    displayName:
      editorProfile?.display_name ??
      account?.displayName ??
      identity?.displayName ??
      null,
  };
}
