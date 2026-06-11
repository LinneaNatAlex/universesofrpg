import { readJson, writeJson } from "@/lib/browser-storage";
import { isVerifiedCreator } from "@/lib/verified-creators-store";

const STORAGE_KEY = "uorpg-creator-preferences";

interface CreatorPreferences {
  username: string;
  accept_friend_requests: boolean;
  show_follow_button: boolean;
  show_friends_list: boolean;
}

let prefs: CreatorPreferences[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function load() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  prefs = readJson<CreatorPreferences[]>(STORAGE_KEY, []).map((row) => ({
    username: row.username.toLowerCase(),
    accept_friend_requests: row.accept_friend_requests ?? true,
    show_follow_button: row.show_follow_button ?? true,
    show_friends_list: row.show_friends_list ?? true,
  }));
}

function ensureLoaded() {
  load();
}

function persist() {
  writeJson(STORAGE_KEY, prefs);
}

function userKey(username: string) {
  return username.toLowerCase();
}

function getPrefs(username: string): CreatorPreferences {
  ensureLoaded();
  const key = userKey(username);
  const row = prefs.find((p) => userKey(p.username) === key);
  return {
    username: key,
    accept_friend_requests: row?.accept_friend_requests ?? true,
    show_follow_button: row?.show_follow_button ?? true,
    show_friends_list: row?.show_friends_list ?? true,
  };
}

function upsertPrefs(
  username: string,
  patch: Partial<
    Pick<
      CreatorPreferences,
      "accept_friend_requests" | "show_follow_button" | "show_friends_list"
    >
  >
): void {
  ensureLoaded();
  const current = getPrefs(username);
  prefs = [
    ...prefs.filter((p) => userKey(p.username) !== current.username),
    { ...current, ...patch, username: current.username },
  ];
  persist();
  notify();
}

export function subscribeCreatorPreferences(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function acceptsFriendRequests(username: string): boolean {
  if (!isVerifiedCreator(username)) return true;
  return getPrefs(username).accept_friend_requests;
}

export function showsFollowButton(username: string): boolean {
  if (!isVerifiedCreator(username)) return true;
  return getPrefs(username).show_follow_button;
}

export function setAcceptFriendRequests(username: string, accept: boolean): void {
  upsertPrefs(username, { accept_friend_requests: accept });
}

export function setShowFollowButton(username: string, show: boolean): void {
  upsertPrefs(username, { show_follow_button: show });
}

export function showsFriendsList(username: string): boolean {
  return getPrefs(username).show_friends_list;
}

export function setShowFriendsList(username: string, show: boolean): void {
  upsertPrefs(username, { show_friends_list: show });
}
