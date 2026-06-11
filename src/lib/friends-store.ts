import type { FriendLink } from "@/types/database";

const friendsByOwner = new Map<string, FriendLink[]>();
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function storageKey() {
  return "uorpg-friends";
}

function ownerKey(username: string) {
  return username.toLowerCase();
}

function loadFromStorage() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return;
    const data = JSON.parse(raw) as Record<string, FriendLink[]>;
    friendsByOwner.clear();
    for (const [owner, list] of Object.entries(data)) {
      friendsByOwner.set(ownerKey(owner), list);
    }
  } catch {
    /* ignore */
  }
}

function ensureLoaded() {
  loadFromStorage();
}

function persist() {
  if (typeof window === "undefined") return;
  const data: Record<string, FriendLink[]> = {};
  friendsByOwner.forEach((list, owner) => {
    data[owner] = list;
  });
  localStorage.setItem(storageKey(), JSON.stringify(data));
}

export function subscribeFriends(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFriends(ownerUsername: string): FriendLink[] {
  ensureLoaded();
  return [...(friendsByOwner.get(ownerKey(ownerUsername)) ?? [])];
}

export function isFriend(ownerUsername: string, friendUsername: string): boolean {
  return getFriends(ownerUsername).some(
    (f) => f.username.toLowerCase() === friendUsername.toLowerCase()
  );
}

export function addFriend(
  ownerUsername: string,
  friendUsername: string,
  displayName: string
): FriendLink | null {
  ensureLoaded();
  if (ownerKey(ownerUsername) === ownerKey(friendUsername)) return null;

  const list = friendsByOwner.get(ownerKey(ownerUsername)) ?? [];
  if (list.some((f) => f.username.toLowerCase() === friendUsername.toLowerCase())) {
    return list.find((f) => f.username.toLowerCase() === friendUsername.toLowerCase()) ?? null;
  }

  const link: FriendLink = {
    username: friendUsername.toLowerCase(),
    display_name: displayName,
    added_at: new Date().toISOString(),
  };
  friendsByOwner.set(ownerKey(ownerUsername), [link, ...list]);
  persist();
  notify();
  return link;
}

export function removeFriend(ownerUsername: string, friendUsername: string): boolean {
  ensureLoaded();
  const key = ownerKey(ownerUsername);
  const list = friendsByOwner.get(key) ?? [];
  const next = list.filter((f) => f.username.toLowerCase() !== friendUsername.toLowerCase());
  if (next.length === list.length) return false;
  friendsByOwner.set(key, next);
  persist();
  notify();
  return true;
}

export function addMutualFriends(
  aUsername: string,
  aDisplayName: string,
  bUsername: string,
  bDisplayName: string
): void {
  addFriend(aUsername, bUsername, bDisplayName);
  addFriend(bUsername, aUsername, aDisplayName);
}

export function removeMutualFriends(aUsername: string, bUsername: string): void {
  removeFriend(aUsername, bUsername);
  removeFriend(bUsername, aUsername);
}

export function getFriendsForOwners(ownerUsernames: string[]): FriendLink[] {
  ensureLoaded();
  const map = new Map<string, FriendLink>();
  for (const owner of ownerUsernames) {
    for (const friend of getFriends(owner)) {
      map.set(friend.username.toLowerCase(), friend);
    }
  }
  return [...map.values()].sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  );
}
