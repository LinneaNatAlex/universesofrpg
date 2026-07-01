"use client";

import type { PrivateMessagesPlatformState } from "@/app/api/content/private-messages/route";
import { mergePrivateMessagesState } from "@/lib/content-platform-merge";
import { writeJson } from "@/lib/browser-storage";
import { authHeadersForSync } from "@/lib/sync-auth";

const STORAGE_KEY = "uorpg-messages";

export const MESSAGES_SYNCED_EVENT = "uorpg-messages-synced";

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushChain: Promise<void> = Promise.resolve();

async function authHeaders(): Promise<Record<string, string>> {
  return authHeadersForSync();
}

export async function fetchPrivateMessagesPlatformState(): Promise<PrivateMessagesPlatformState | null> {
  try {
    const res = await fetch("/api/content/private-messages", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as PrivateMessagesPlatformState;
  } catch {
    return null;
  }
}

export function pushPrivateMessagesPlatformState(
  state: PrivateMessagesPlatformState,
): Promise<boolean> {
  return new Promise((resolve) => {
    pushChain = pushChain.then(async () => {
      try {
        const headers = await authHeaders();
        const res = await fetch("/api/content/private-messages", {
          method: "PUT",
          credentials: "include",
          headers,
          body: JSON.stringify(state),
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          console.warn(
            "[message-sync] private-messages failed:",
            payload.error ?? res.status,
          );
          resolve(false);
          return;
        }

        resolve(true);
      } catch (err) {
        console.warn(
          "[message-sync] private-messages failed:",
          err instanceof Error ? err.message : "Network error",
        );
        resolve(false);
      }
    });
  });
}

export function schedulePrivateMessagesPush(
  state: PrivateMessagesPlatformState,
): void {
  if (typeof window === "undefined") return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushPrivateMessagesPlatformState(state);
  }, 400);
}

export function saveMergedMessagesState(state: PrivateMessagesPlatformState): void {
  writeJson(STORAGE_KEY, state);
}

export async function hydrateMessagesFromServer(options?: {
  pushIfLoggedIn?: boolean;
}): Promise<void> {
  const remote = await fetchPrivateMessagesPlatformState();
  if (!remote) return;

  const { buildMessagesPersistState, applyMessagesPersistState } = await import(
    "@/lib/messages-store"
  );
  const local = buildMessagesPersistState();
  const merged = mergePrivateMessagesState(local, remote);
  applyMessagesPersistState(merged);
  saveMergedMessagesState(merged);

  if (options?.pushIfLoggedIn) {
    const { syncMessagesToServer } = await import("@/lib/messages-store");
    await syncMessagesToServer();
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MESSAGES_SYNCED_EVENT));
  }
}
