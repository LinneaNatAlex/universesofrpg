import type { DiscoverableUser } from "@/lib/discover-users";

const STORAGE_KEY = "uorpg-known-users";

let cache: DiscoverableUser[] | null = null;

function read(): DiscoverableUser[] {
  if (typeof window === "undefined") return [];
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as DiscoverableUser[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(users: DiscoverableUser[]) {
  if (typeof window === "undefined") return;
  cache = users;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function getKnownUsers(): DiscoverableUser[] {
  return read();
}

export function registerKnownUser(user: DiscoverableUser): void {
  const username = user.username.toLowerCase();
  const list = read();
  if (list.some((u) => u.username.toLowerCase() === username)) return;
  write([
    ...list,
    { username: user.username.toLowerCase(), display_name: user.display_name },
  ]);
}
