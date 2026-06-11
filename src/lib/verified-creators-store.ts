import { DEMO_PERSONAS } from "@/lib/personas";

/** Usernames with verified creator badge (seeded from demo personas + admin grants) */
const verified = new Set<string>(
  DEMO_PERSONAS.filter((p) => p.is_verified_creator).map((p) => p.username.toLowerCase())
);

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function storageKey() {
  return "uorpg-verified-creators";
}

function loadFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return;
    const extra = JSON.parse(raw) as string[];
    extra.forEach((u) => verified.add(u.toLowerCase()));
  } catch {
    /* ignore */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  const seeded = new Set(
    DEMO_PERSONAS.filter((p) => p.is_verified_creator).map((p) => p.username.toLowerCase())
  );
  const custom = [...verified].filter((u) => !seeded.has(u));
  localStorage.setItem(storageKey(), JSON.stringify(custom));
}

if (typeof window !== "undefined") {
  loadFromStorage();
}

export function subscribeVerifiedCreators(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isSeededVerifiedCreator(username: string): boolean {
  const key = username.toLowerCase();
  return DEMO_PERSONAS.some(
    (p) => p.username.toLowerCase() === key && p.is_verified_creator
  );
}

export function isVerifiedCreator(username: string): boolean {
  const key = username.toLowerCase();
  if (isSeededVerifiedCreator(username)) return true;
  return verified.has(key);
}

export function grantVerifiedCreator(username: string): void {
  verified.add(username.toLowerCase());
  persist();
  notify();
}

export function revokeVerifiedCreator(username: string): void {
  if (isSeededVerifiedCreator(username)) return;
  verified.delete(username.toLowerCase());
  persist();
  notify();
}

export function getAllVerifiedCreators(): string[] {
  return [...verified];
}
