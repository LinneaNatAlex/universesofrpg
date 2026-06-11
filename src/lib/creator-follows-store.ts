import { readJson, writeJson } from "@/lib/browser-storage";

const STORAGE_KEY = "uorpg-creator-follows";

/** Demo seed — Ronin Forge meets verified eligibility thresholds in local/test mode. */
function buildMockFollows(): CreatorFollow[] {
  const rows: CreatorFollow[] = [];
  const base = new Date();
  for (let i = 1; i <= 320; i++) {
    const followed = new Date(base);
    followed.setHours(followed.getHours() - i);
    rows.push({
      username: `ronin_fan_${i}`,
      creator_username: "roninforge",
      creator_display_name: "Ronin Forge",
      followed_at: followed.toISOString(),
    });
  }
  return rows;
}

const MOCK_FOLLOWS = buildMockFollows();

function userKey(username: string) {
  return username.toLowerCase();
}

function followKey(row: CreatorFollow) {
  return `${userKey(row.username)}:${userKey(row.creator_username)}`;
}

function mergeWithMockFollows(stored: CreatorFollow[]): CreatorFollow[] {
  const map = new Map<string, CreatorFollow>();
  for (const row of MOCK_FOLLOWS) {
    map.set(followKey(row), row);
  }
  for (const row of stored) {
    map.set(followKey(row), row);
  }
  return [...map.values()];
}

export interface CreatorFollow {
  username: string;
  creator_username: string;
  creator_display_name: string;
  followed_at: string;
}

let follows: CreatorFollow[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function load() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  const stored = readJson<CreatorFollow[]>(STORAGE_KEY, []);
  follows = mergeWithMockFollows(stored);
}

function ensureLoaded() {
  load();
}

function persist() {
  writeJson(STORAGE_KEY, follows);
}

export function subscribeCreatorFollows(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isFollowingCreator(
  username: string,
  creatorUsername: string
): boolean {
  ensureLoaded();
  const user = userKey(username);
  const creator = userKey(creatorUsername);
  return follows.some(
    (f) => userKey(f.username) === user && userKey(f.creator_username) === creator
  );
}

export function getFollowedCreators(username: string): CreatorFollow[] {
  ensureLoaded();
  const user = userKey(username);
  return follows
    .filter((f) => userKey(f.username) === user)
    .sort(
      (a, b) =>
        new Date(b.followed_at).getTime() - new Date(a.followed_at).getTime()
    );
}

export function getCreatorFollowerCount(creatorUsername: string): number {
  ensureLoaded();
  const creator = userKey(creatorUsername);
  return follows.filter((f) => userKey(f.creator_username) === creator).length;
}

export function followCreator(
  username: string,
  creatorUsername: string,
  creatorDisplayName: string
): boolean {
  ensureLoaded();
  const user = userKey(username);
  const creator = userKey(creatorUsername);
  if (user === creator) return false;
  if (isFollowingCreator(username, creatorUsername)) return false;

  follows = [
    {
      username: user,
      creator_username: creator,
      creator_display_name: creatorDisplayName,
      followed_at: new Date().toISOString(),
    },
    ...follows,
  ];
  persist();
  notify();
  return true;
}

export function unfollowCreator(username: string, creatorUsername: string): boolean {
  ensureLoaded();
  const user = userKey(username);
  const creator = userKey(creatorUsername);
  const before = follows.length;
  follows = follows.filter(
    (f) =>
      !(userKey(f.username) === user && userKey(f.creator_username) === creator)
  );
  if (follows.length === before) return false;
  persist();
  notify();
  return true;
}
