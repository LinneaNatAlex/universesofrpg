"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAccountIdentity } from "@/hooks/useAccountIdentity";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { canReviewPaidContent } from "@/lib/editor-constants";
import {
  getEditorProfile,
  subscribeEditorProfiles,
} from "@/lib/editor-profiles-store";
import type { EditorLevel, EditorProfile } from "@/types/database";
import type { User } from "@supabase/supabase-js";

function editorLookupUsernames(
  accountUsername: string | null,
  actingUsername: string | null,
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
  const [profile, setProfile] = useState<EditorProfile | null | undefined>(undefined);

  const lookupUsernames = useMemo(
    () =>
      editorLookupUsernames(
        account?.username ?? null,
        identity?.username ?? null,
        user
      ),
    [account?.username, identity?.username, user]
  );

  useEffect(() => {
    if (!isLoggedIn) {
      setProfile(null);
      return;
    }

    if (lookupUsernames.length === 0) {
      setProfile(null);
      return;
    }

    const refresh = () => {
      setProfile(resolveEditorProfile(lookupUsernames) ?? null);
    };

    refresh();
    return subscribeEditorProfiles(refresh);
  }, [isLoggedIn, lookupUsernames]);

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
