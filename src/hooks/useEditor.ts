"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAccountIdentity } from "@/hooks/useAccountIdentity";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useProfileDbUsername } from "@/hooks/useProfileDbUsername";
import { canReviewPaidContent } from "@/lib/editor-constants";
import { CONTENT_SYNCED_EVENT } from "@/lib/content-sync";
import {
  getEditorProfile,
  subscribeEditorProfiles,
} from "@/lib/editor-profiles-store";
import type { EditorLevel, EditorProfile } from "@/types/database";
import type { User } from "@supabase/supabase-js";

function editorLookupUsernames(
  accountUsername: string | null,
  actingUsername: string | null,
  dbUsername: string | null,
  user: User | null
): string[] {
  const seen = new Set<string>();
  const names: string[] = [];

  const add = (value?: string | null) => {
    const key = value?.trim().toLowerCase();
    if (!key || key.length < 2 || seen.has(key)) return;
    seen.add(key);
    names.push(key);
  };

  add(accountUsername);
  add(actingUsername);
  add(dbUsername);

  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  if (typeof meta?.username === "string") add(meta.username);

  add(user?.email?.split("@")[0]);

  return names;
}

function resolveEditorProfile(usernames: string[]): EditorProfile | null {
  for (const username of usernames) {
    const profile = getEditorProfile(username);
    if (profile) return profile;
  }
  return null;
}

export function useEditor() {
  const { isLoggedIn, user } = useAdmin();
  const account = useAccountIdentity();
  const identity = useActingIdentity();
  const { username: dbUsername, loading: profileDbLoading } = useProfileDbUsername(
    user?.id,
    isLoggedIn
  );
  const [profile, setProfile] = useState<EditorProfile | null | undefined>(undefined);

  const lookupUsernames = useMemo(
    () =>
      editorLookupUsernames(
        account?.username ?? null,
        identity?.username ?? null,
        dbUsername,
        user
      ),
    [account?.username, identity?.username, dbUsername, user]
  );

  const identityResolving =
    isLoggedIn &&
    profileDbLoading &&
    !account?.username &&
    !identity?.username &&
    !dbUsername;

  useEffect(() => {
    if (!isLoggedIn) {
      setProfile(null);
      return;
    }

    if (identityResolving) {
      setProfile(undefined);
      return;
    }

    const refresh = () => {
      setProfile(resolveEditorProfile(lookupUsernames) ?? null);
    };

    refresh();
    const unsub = subscribeEditorProfiles(refresh);
    const onSync = () => refresh();
    window.addEventListener(CONTENT_SYNCED_EVENT, onSync);

    return () => {
      unsub();
      window.removeEventListener(CONTENT_SYNCED_EVENT, onSync);
    };
  }, [isLoggedIn, identityResolving, lookupUsernames]);

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
    username: editorProfile?.username ?? lookupUsernames[0] ?? null,
    displayName:
      editorProfile?.display_name ??
      account?.displayName ??
      identity?.displayName ??
      null,
  };
}
