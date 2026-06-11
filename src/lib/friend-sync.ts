"use client";

import type { FriendRequestsPlatformState } from "@/app/api/content/friend-requests/route";
import type { FriendsPlatformState } from "@/app/api/content/friends/route";
import { writeJson } from "@/lib/browser-storage";
import { createClient } from "@/lib/supabase/client";
import type { FriendLink, FriendRequest } from "@/types/database";

const REQUESTS_KEY = "uorpg-friend-requests";
const FRIENDS_KEY = "uorpg-friends";

export const FRIENDS_SYNCED_EVENT = "uorpg-friends-synced";

let requestsPushTimer: ReturnType<typeof setTimeout> | null = null;
let friendsPushTimer: ReturnType<typeof setTimeout> | null = null;
let pushChain: Promise<void> = Promise.resolve();

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // Cookie session may still work.
  }

  return headers;
}

function requestTimestamp(req: FriendRequest): number {
  const stamp = req.responded_at ?? req.created_at;
  return new Date(stamp).getTime();
}

function pickNewerRequest(a: FriendRequest, b: FriendRequest): FriendRequest {
  return requestTimestamp(b) >= requestTimestamp(a) ? b : a;
}

export function mergeFriendRequests(
  local: FriendRequest[],
  remote: FriendRequest[]
): FriendRequest[] {
  const byId = new Map<string, FriendRequest>();

  for (const req of [...local, ...remote]) {
    const prev = byId.get(req.id);
    byId.set(req.id, prev ? pickNewerRequest(prev, req) : req);
  }

  const pendingByPair = new Map<string, FriendRequest>();
  const settled: FriendRequest[] = [];

  for (const req of byId.values()) {
    if (req.status !== "pending") {
      settled.push(req);
      continue;
    }
    const pairKey = `${req.from_username}:${req.to_username}`;
    const prev = pendingByPair.get(pairKey);
    pendingByPair.set(
      pairKey,
      prev ? pickNewerRequest(prev, req) : req
    );
  }

  return [...settled, ...pendingByPair.values()].sort(
    (a, b) => requestTimestamp(b) - requestTimestamp(a)
  );
}

function mergeFriendLinks(a: FriendLink[], b: FriendLink[]): FriendLink[] {
  const map = new Map<string, FriendLink>();
  for (const link of [...a, ...b]) {
    const key = link.username.toLowerCase();
    const prev = map.get(key);
    if (!prev || new Date(link.added_at) > new Date(prev.added_at)) {
      map.set(key, link);
    }
  }
  return [...map.values()].sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  );
}

export function mergeFriendsState(
  local: FriendsPlatformState,
  remote: FriendsPlatformState
): FriendsPlatformState {
  const owners = new Set([
    ...Object.keys(local.byOwner ?? {}),
    ...Object.keys(remote.byOwner ?? {}),
  ]);
  const byOwner: Record<string, FriendLink[]> = {};

  for (const owner of owners) {
    const merged = mergeFriendLinks(
      local.byOwner?.[owner] ?? [],
      remote.byOwner?.[owner] ?? []
    );
    if (merged.length > 0) byOwner[owner] = merged;
  }

  return { byOwner };
}

async function pushPlatformState<T>(
  target: "friend-requests" | "friends",
  state: T
): Promise<boolean> {
  try {
    const headers = await authHeaders();
    const res = await fetch(`/api/content/${target}`, {
      method: "PUT",
      credentials: "include",
      headers,
      body: JSON.stringify(state),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      console.warn(
        `[friend-sync] ${target} failed:`,
        payload.error ?? res.status
      );
      return false;
    }

    return true;
  } catch (err) {
    console.warn(
      `[friend-sync] ${target} failed:`,
      err instanceof Error ? err.message : "Network error"
    );
    return false;
  }
}

export async function fetchFriendRequestsPlatformState(): Promise<FriendRequestsPlatformState | null> {
  try {
    const res = await fetch("/api/content/friend-requests", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as FriendRequestsPlatformState;
  } catch {
    return null;
  }
}

export async function fetchFriendsPlatformState(): Promise<FriendsPlatformState | null> {
  try {
    const res = await fetch("/api/content/friends", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as FriendsPlatformState;
  } catch {
    return null;
  }
}

export function pushFriendRequestsPlatformState(
  state: FriendRequestsPlatformState
): Promise<boolean> {
  return new Promise((resolve) => {
    pushChain = pushChain.then(async () => {
      const ok = await pushPlatformState("friend-requests", state);
      resolve(ok);
    });
  });
}

export function pushFriendsPlatformState(
  state: FriendsPlatformState
): Promise<boolean> {
  return new Promise((resolve) => {
    pushChain = pushChain.then(async () => {
      const ok = await pushPlatformState("friends", state);
      resolve(ok);
    });
  });
}

export function scheduleFriendRequestsPush(state: FriendRequestsPlatformState): void {
  if (typeof window === "undefined") return;
  if (requestsPushTimer) clearTimeout(requestsPushTimer);
  requestsPushTimer = setTimeout(() => {
    requestsPushTimer = null;
    void pushFriendRequestsPlatformState(state);
  }, 400);
}

export function scheduleFriendsPush(state: FriendsPlatformState): void {
  if (typeof window === "undefined") return;
  if (friendsPushTimer) clearTimeout(friendsPushTimer);
  friendsPushTimer = setTimeout(() => {
    friendsPushTimer = null;
    void pushFriendsPlatformState(state);
  }, 400);
}

export function saveMergedFriendRequests(requests: FriendRequest[]): void {
  writeJson(REQUESTS_KEY, requests);
}

export function saveMergedFriendsState(state: FriendsPlatformState): void {
  writeJson(FRIENDS_KEY, state.byOwner);
}

function ownerHasFriend(
  byOwner: Record<string, FriendLink[]>,
  owner: string,
  friend: string
): boolean {
  const list = byOwner[owner.toLowerCase()] ?? [];
  return list.some((f) => f.username.toLowerCase() === friend.toLowerCase());
}

/** Rebuild missing friend links when a request is already marked accepted. */
export function repairFriendsFromAcceptedRequests(
  requests: FriendRequest[],
  friendsState: FriendsPlatformState
): FriendsPlatformState {
  const byOwner: Record<string, FriendLink[]> = {};

  for (const [owner, list] of Object.entries(friendsState.byOwner ?? {})) {
    byOwner[owner.toLowerCase()] = [...list];
  }

  const addLink = (owner: string, friend: string, displayName: string) => {
    const ownerKey = owner.toLowerCase();
    const friendKey = friend.toLowerCase();
    if (ownerKey === friendKey) return;
    if (ownerHasFriend(byOwner, ownerKey, friendKey)) return;

    const link: FriendLink = {
      username: friendKey,
      display_name: displayName,
      added_at: new Date().toISOString(),
    };
    byOwner[ownerKey] = [link, ...(byOwner[ownerKey] ?? [])];
  };

  for (const req of requests) {
    if (req.status !== "accepted") continue;
    addLink(req.from_username, req.to_username, req.to_display_name);
    addLink(req.to_username, req.from_username, req.from_display_name);
  }

  return { byOwner };
}

export async function hydrateSocialFromServer(options?: {
  pushIfLoggedIn?: boolean;
}): Promise<void> {
  const [remoteRequests, remoteFriends] = await Promise.all([
    fetchFriendRequestsPlatformState(),
    fetchFriendsPlatformState(),
  ]);

  let mergedRequests: FriendRequest[] | null = null;

  if (remoteRequests) {
    const { buildFriendRequestsState, applyFriendRequestsState } = await import(
      "@/lib/friend-requests-store"
    );
    const local = buildFriendRequestsState();
    mergedRequests = mergeFriendRequests(
      local.requests,
      remoteRequests.requests ?? []
    );
    applyFriendRequestsState({ requests: mergedRequests });
    saveMergedFriendRequests(mergedRequests);
  }

  if (remoteFriends || mergedRequests) {
    const { buildFriendsState, applyFriendsState } = await import(
      "@/lib/friends-store"
    );
    const local = buildFriendsState();
    let merged = remoteFriends
      ? mergeFriendsState(local, remoteFriends)
      : local;

    if (mergedRequests) {
      merged = repairFriendsFromAcceptedRequests(mergedRequests, merged);
    }

    applyFriendsState(merged);
    saveMergedFriendsState(merged);
  }

  if (options?.pushIfLoggedIn) {
    const { syncFriendRequestsToServer } = await import(
      "@/lib/friend-requests-store"
    );
    const { syncFriendsToServer } = await import("@/lib/friends-store");
    await Promise.all([syncFriendRequestsToServer(), syncFriendsToServer()]);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FRIENDS_SYNCED_EVENT));
  }
}
