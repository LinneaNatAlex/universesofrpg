import { readJson, writeJson } from "@/lib/browser-storage";

const STORAGE_KEY = "uorpg-topic-follows";

export interface TopicFollow {
  username: string;
  forum_id: string;
  followed_at: string;
}

let follows: TopicFollow[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function load() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  follows = readJson<TopicFollow[]>(STORAGE_KEY, []);
}

function ensureLoaded() {
  load();
}

function persist() {
  writeJson(STORAGE_KEY, follows);
}

function userKey(username: string) {
  return username.toLowerCase();
}

export function subscribeTopicFollows(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isFollowingTopic(username: string, forumId: string): boolean {
  ensureLoaded();
  const key = userKey(username);
  return follows.some(
    (f) => f.forum_id === forumId && userKey(f.username) === key
  );
}

export function getFollowedTopicIds(username: string): string[] {
  ensureLoaded();
  const key = userKey(username);
  return follows
    .filter((f) => userKey(f.username) === key)
    .sort((a, b) => new Date(b.followed_at).getTime() - new Date(a.followed_at).getTime())
    .map((f) => f.forum_id);
}

export function getForumFollowerUsernames(forumId: string): string[] {
  ensureLoaded();
  return follows.filter((f) => f.forum_id === forumId).map((f) => f.username);
}

export function followTopic(username: string, forumId: string): boolean {
  ensureLoaded();
  if (isFollowingTopic(username, forumId)) return false;
  follows = [
    {
      username: userKey(username),
      forum_id: forumId,
      followed_at: new Date().toISOString(),
    },
    ...follows,
  ];
  persist();
  notify();
  return true;
}

export function unfollowTopic(username: string, forumId: string): boolean {
  ensureLoaded();
  const key = userKey(username);
  const before = follows.length;
  follows = follows.filter(
    (f) => !(f.forum_id === forumId && userKey(f.username) === key)
  );
  if (follows.length === before) return false;
  persist();
  notify();
  return true;
}

export function getFollowCountForUser(username: string): number {
  return getFollowedTopicIds(username).length;
}
