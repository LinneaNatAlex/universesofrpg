import type { FriendRequestsPlatformState } from "@/app/api/content/friend-requests/route";
import { acceptsFriendRequests } from "@/lib/creator-preferences-store";
import { scheduleFriendRequestsPush } from "@/lib/friend-sync";
import { addMutualFriends, isFriend, removeMutualFriends } from "@/lib/friends-store";
import { isVerifiedCreator } from "@/lib/verified-creators-store";
import type { FriendRequest } from "@/types/database";

const STORAGE_KEY = "uorpg-friend-requests";
let requests: FriendRequest[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function userKey(username: string) {
  return username.toLowerCase();
}

function sanitizeRequests(list: FriendRequest[]): FriendRequest[] {
  return list.filter(
    (r) =>
      r.from_username &&
      r.to_username &&
      userKey(r.from_username) !== userKey(r.to_username)
  );
}

function loadFromStorage() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as FriendRequest[]) : [];
    requests = sanitizeRequests(parsed);
  } catch {
    requests = [];
  }
}

function ensureLoaded() {
  loadFromStorage();
}

export function buildFriendRequestsState(): FriendRequestsPlatformState {
  ensureLoaded();
  return { requests: [...requests] };
}

export function applyFriendRequestsState(state: FriendRequestsPlatformState): void {
  ensureLoaded();
  requests = sanitizeRequests(Array.isArray(state.requests) ? state.requests : []);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }
  notify();
}

export async function syncFriendRequestsToServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { pushFriendRequestsPlatformState } = await import("@/lib/friend-sync");
  return pushFriendRequestsPlatformState(buildFriendRequestsState());
}

function persist() {
  if (typeof window === "undefined") return;
  const state = buildFriendRequestsState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.requests));
  scheduleFriendRequestsPush(state);
}

export type FriendRelationship =
  | "self"
  | "friends"
  | "pending_outgoing"
  | "pending_incoming"
  | "none";

export function subscribeFriendRequests(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getIncomingFriendRequests(username: string): FriendRequest[] {
  ensureLoaded();
  const key = userKey(username);
  return requests
    .filter((r) => r.status === "pending" && userKey(r.to_username) === key)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getOutgoingFriendRequests(username: string): FriendRequest[] {
  ensureLoaded();
  const key = userKey(username);
  return requests
    .filter((r) => r.status === "pending" && userKey(r.from_username) === key)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getFriendRelationship(
  viewerUsername: string,
  targetUsername: string
): FriendRelationship {
  if (userKey(viewerUsername) === userKey(targetUsername)) return "self";
  if (isFriend(viewerUsername, targetUsername)) return "friends";

  ensureLoaded();
  const viewer = userKey(viewerUsername);
  const target = userKey(targetUsername);

  const outgoing = requests.find(
    (r) =>
      r.status === "pending" &&
      userKey(r.from_username) === viewer &&
      userKey(r.to_username) === target
  );
  if (outgoing) return "pending_outgoing";

  const incoming = requests.find(
    (r) =>
      r.status === "pending" &&
      userKey(r.from_username) === target &&
      userKey(r.to_username) === viewer
  );
  if (incoming) return "pending_incoming";

  return "none";
}

export function sendFriendRequest(
  fromUsername: string,
  fromDisplayName: string,
  toUsername: string,
  toDisplayName: string
): { ok: true; request: FriendRequest } | { ok: false; error: string } {
  ensureLoaded();

  if (userKey(fromUsername) === userKey(toUsername)) {
    return { ok: false, error: "You cannot add yourself." };
  }

  if (isVerifiedCreator(toUsername) && !acceptsFriendRequests(toUsername)) {
    return {
      ok: false,
      error: "This creator does not accept friend requests. Follow them from their profile instead.",
    };
  }
  if (isFriend(fromUsername, toUsername)) {
    return { ok: false, error: "You are already friends." };
  }

  const relationship = getFriendRelationship(fromUsername, toUsername);
  if (relationship === "pending_outgoing") {
    return { ok: false, error: "Friend request already sent." };
  }
  if (relationship === "pending_incoming") {
    return { ok: false, error: "They already sent you a request — accept it below." };
  }

  const request: FriendRequest = {
    id: `freq-${Date.now()}`,
    from_username: userKey(fromUsername),
    from_display_name: fromDisplayName,
    to_username: userKey(toUsername),
    to_display_name: toDisplayName,
    status: "pending",
    created_at: new Date().toISOString(),
    responded_at: null,
  };

  requests = [request, ...requests];
  persist();
  notify();
  void syncFriendRequestsToServer();
  return { ok: true, request };
}

export function acceptFriendRequest(requestId: string, username: string): boolean {
  ensureLoaded();
  const request = requests.find((r) => r.id === requestId);
  if (!request || request.status !== "pending") return false;
  if (userKey(request.to_username) !== userKey(username)) return false;

  request.status = "accepted";
  request.responded_at = new Date().toISOString();

  addMutualFriends(
    request.from_username,
    request.from_display_name,
    request.to_username,
    request.to_display_name
  );

  persist();
  notify();
  void syncFriendRequestsToServer();
  return true;
}

export function rejectFriendRequest(requestId: string, username: string): boolean {
  ensureLoaded();
  const request = requests.find((r) => r.id === requestId);
  if (!request || request.status !== "pending") return false;
  if (userKey(request.to_username) !== userKey(username)) return false;

  request.status = "rejected";
  request.responded_at = new Date().toISOString();
  persist();
  notify();
  void syncFriendRequestsToServer();
  return true;
}

export function cancelFriendRequest(requestId: string, username: string): boolean {
  ensureLoaded();
  const request = requests.find((r) => r.id === requestId);
  if (!request || request.status !== "pending") return false;
  if (userKey(request.from_username) !== userKey(username)) return false;

  requests = requests.filter((r) => r.id !== requestId);
  persist();
  notify();
  void syncFriendRequestsToServer();
  return true;
}

export function acceptIncomingFromUser(
  viewerUsername: string,
  fromUsername: string
): boolean {
  const incoming = getIncomingFriendRequests(viewerUsername).find(
    (r) => userKey(r.from_username) === userKey(fromUsername)
  );
  if (!incoming) return false;
  return acceptFriendRequest(incoming.id, viewerUsername);
}

export function countIncomingFriendRequests(username: string): number {
  return getIncomingFriendRequests(username).length;
}

export function getIncomingFriendRequestsForInbox(
  usernames: string[]
): FriendRequest[] {
  ensureLoaded();
  const seen = new Set<string>();
  const merged: FriendRequest[] = [];
  for (const username of usernames) {
    for (const req of getIncomingFriendRequests(username)) {
      if (seen.has(req.id)) continue;
      seen.add(req.id);
      merged.push(req);
    }
  }
  return merged.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getOutgoingFriendRequestsForActors(
  usernames: string[]
): FriendRequest[] {
  ensureLoaded();
  const seen = new Set<string>();
  const merged: FriendRequest[] = [];
  for (const username of usernames) {
    for (const req of getOutgoingFriendRequests(username)) {
      if (seen.has(req.id)) continue;
      seen.add(req.id);
      merged.push(req);
    }
  }
  return merged.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
