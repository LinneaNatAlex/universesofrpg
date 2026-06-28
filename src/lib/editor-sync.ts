"use client";

import type { EditorsPlatformState } from "@/app/api/content/editors/route";
import { authHeadersForSync } from "@/lib/sync-auth";
import type { EditorProfile } from "@/types/database";

let editorsPushTimer: ReturnType<typeof setTimeout> | null = null;
let pushChain: Promise<void> = Promise.resolve();

function profileStamp(profile: EditorProfile): number {
  return new Date(profile.granted_at).getTime();
}

function mergeEditorProfile(a: EditorProfile, b: EditorProfile): EditorProfile {
  const newer = profileStamp(b) >= profileStamp(a) ? b : a;
  const older = newer === b ? a : b;
  return {
    ...newer,
    reviews_completed: Math.max(a.reviews_completed, b.reviews_completed),
    trust_score: Math.max(a.trust_score, b.trust_score),
    display_name: newer.display_name || older.display_name,
  };
}

export function mergeEditorsState(
  local: EditorsPlatformState,
  remote: EditorsPlatformState
): EditorsPlatformState {
  const map = new Map<string, EditorProfile>();
  for (const profile of [...(local.profiles ?? []), ...(remote.profiles ?? [])]) {
    const key = profile.username.toLowerCase();
    const prev = map.get(key);
    map.set(key, prev ? mergeEditorProfile(prev, profile) : profile);
  }
  return {
    profiles: [...map.values()].sort(
      (a, b) => profileStamp(b) - profileStamp(a)
    ),
  };
}

export async function fetchEditorsPlatformState(): Promise<EditorsPlatformState | null> {
  try {
    const res = await fetch("/api/content/editors", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as EditorsPlatformState;
  } catch {
    return null;
  }
}

async function pushEditorsPlatformState(
  state: EditorsPlatformState
): Promise<boolean> {
  try {
    const headers = await authHeadersForSync();
    const res = await fetch("/api/content/editors", {
      method: "PUT",
      credentials: "include",
      headers,
      body: JSON.stringify(state),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      console.warn("[editor-sync] push failed:", payload.error ?? res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[editor-sync] push failed:", err);
    return false;
  }
}

export function scheduleEditorsPlatformPush(state: EditorsPlatformState): void {
  if (typeof window === "undefined") return;
  if (editorsPushTimer) clearTimeout(editorsPushTimer);
  editorsPushTimer = setTimeout(() => {
    editorsPushTimer = null;
    pushChain = pushChain.then(async () => {
      await pushEditorsPlatformState(state);
    });
  }, 400);
}
