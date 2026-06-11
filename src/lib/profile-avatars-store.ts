import { readJson, writeJson } from "@/lib/browser-storage";
import { isValidCoverSource } from "@/lib/post-cover";

const STORAGE_KEY = "uorpg-profile-avatars";

interface AvatarRow {
  username: string;
  avatar_url: string;
}

let avatars: AvatarRow[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function load() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  avatars = readJson<AvatarRow[]>(STORAGE_KEY, []);
}

function ensureLoaded() {
  load();
}

function persist(): boolean {
  return writeJson(STORAGE_KEY, avatars);
}

function userKey(username: string) {
  return username.toLowerCase();
}

export function subscribeProfileAvatars(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getProfileAvatarUrl(username: string | null | undefined): string | null {
  if (!username) return null;
  ensureLoaded();
  const row = avatars.find((a) => userKey(a.username) === userKey(username));
  return row?.avatar_url ?? null;
}

export function setProfileAvatarUrl(username: string, url: string | null): boolean {
  ensureLoaded();
  const key = userKey(username);

  if (!url) {
    avatars = avatars.filter((a) => userKey(a.username) !== key);
  } else if (!isValidCoverSource(url)) {
    return false;
  } else {
    const rest = avatars.filter((a) => userKey(a.username) !== key);
    avatars = [...rest, { username: key, avatar_url: url }];
  }

  const ok = persist();
  if (ok) notify();
  return ok;
}
