import { DEMO_PERSONAS } from "@/lib/personas";

/** Usernames with verified creator badge (seeded from demo personas + admin grants) */
const verified = new Set<string>(
  DEMO_PERSONAS.filter((p) => p.is_verified_creator).map((p) => p.username.toLowerCase())
);

/** Admin-forced removal — overrides seeded demo badges too. */
const adminRevoked = new Set<string>();

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function storageKey() {
  return "uorpg-verified-creators";
}

function revokedStorageKey() {
  return "uorpg-verified-admin-revoked";
}

function loadFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) {
      const extra = JSON.parse(raw) as string[];
      extra.forEach((u) => verified.add(u.toLowerCase()));
    }
    const revokedRaw = localStorage.getItem(revokedStorageKey());
    if (revokedRaw) {
      const revoked = JSON.parse(revokedRaw) as string[];
      revoked.forEach((u) => adminRevoked.add(u.toLowerCase()));
    }
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
  localStorage.setItem(revokedStorageKey(), JSON.stringify([...adminRevoked]));
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

export function isAdminRevokedVerifiedCreator(username: string): boolean {
  return adminRevoked.has(username.toLowerCase());
}

export function isVerifiedCreator(username: string): boolean {
  const key = username.toLowerCase();
  if (adminRevoked.has(key)) return false;
  if (isSeededVerifiedCreator(username)) return true;
  return verified.has(key);
}

export function grantVerifiedCreator(username: string): void {
  const key = username.toLowerCase();
  adminRevoked.delete(key);
  verified.add(key);
  persist();
  notify();
}

export function revokeVerifiedCreator(username: string): void {
  if (isSeededVerifiedCreator(username)) return;
  verified.delete(username.toLowerCase());
  persist();
  notify();
}

/** Admin — remove verified badge (including demo personas). */
export function adminRevokeVerifiedCreator(username: string): void {
  const key = username.toLowerCase();
  adminRevoked.add(key);
  verified.delete(key);
  persist();
  notify();
}

/** Admin — undo a forced revocation (does not recreate Stripe subscription). */
export function adminRestoreVerifiedCreator(username: string): void {
  const key = username.toLowerCase();
  adminRevoked.delete(key);
  if (isSeededVerifiedCreator(username)) {
    verified.add(key);
  }
  persist();
  notify();
}

export function getAllVerifiedCreators(): string[] {
  return [...verified];
}

export function getAllAdminRevokedVerifiedCreators(): string[] {
  return [...adminRevoked];
}
