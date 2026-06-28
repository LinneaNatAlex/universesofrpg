import type { EditorsPlatformState } from "@/app/api/content/editors/route";
import { readJson, writeJson } from "@/lib/browser-storage";
import { scheduleEditorsPlatformPush } from "@/lib/editor-sync";
import type { EditorLevel, EditorProfile } from "@/types/database";

const STORAGE_KEY = "uorpg-editor-profiles";

const SEED_EDITOR_PROFILES: EditorProfile[] = [
  {
    username: "leon_jezz",
    display_name: "Leon Jezz",
    level: "standard",
    rate_cents_min: 200,
    rate_cents_max: 1000,
    trust_score: 92,
    reviews_completed: 14,
    granted_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    granted_by: "admin",
  },
];

let profiles: EditorProfile[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function load() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  const stored = readJson<EditorProfile[]>(STORAGE_KEY, []);
  profiles = stored.length > 0 ? stored : [...SEED_EDITOR_PROFILES];
  if (stored.length === 0) persist();
}

function ensureLoaded() {
  load();
}

function persist() {
  writeJson(STORAGE_KEY, profiles);
  scheduleEditorsPlatformPush(buildEditorsPlatformState());
}

export function buildEditorsPlatformState(): EditorsPlatformState {
  ensureLoaded();
  return { profiles: [...profiles] };
}

export function applyEditorsPlatformState(state: EditorsPlatformState): void {
  ensureLoaded();
  profiles = Array.isArray(state.profiles) ? [...state.profiles] : [];
  writeJson(STORAGE_KEY, profiles);
  notify();
}

export function subscribeEditorProfiles(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAllEditorProfiles(): EditorProfile[] {
  ensureLoaded();
  return [...profiles].sort(
    (a, b) => new Date(b.granted_at).getTime() - new Date(a.granted_at).getTime()
  );
}

export function getEditorProfile(username: string): EditorProfile | undefined {
  ensureLoaded();
  return profiles.find((e) => e.username.toLowerCase() === username.toLowerCase());
}

export function grantEditorProfile(
  username: string,
  displayName: string,
  level: EditorLevel,
  grantedBy: string
): EditorProfile {
  ensureLoaded();
  const key = username.toLowerCase();
  const existing = profiles.find((e) => e.username.toLowerCase() === key);
  if (existing) {
    existing.level = level;
    existing.display_name = displayName;
    existing.granted_by = grantedBy;
    existing.granted_at = new Date().toISOString();
    persist();
    notify();
    return existing;
  }

  const defaults: Record<EditorLevel, { min: number; max: number }> = {
    junior: { min: 50, max: 200 },
    standard: { min: 200, max: 1000 },
    senior: { min: 1000, max: 5000 },
    admin_verified: { min: 0, max: 0 },
  };

  const profile: EditorProfile = {
    username: key,
    display_name: displayName,
    level,
    rate_cents_min: defaults[level].min,
    rate_cents_max: defaults[level].max,
    trust_score: 75,
    reviews_completed: 0,
    granted_at: new Date().toISOString(),
    granted_by: grantedBy,
  };
  profiles.push(profile);
  persist();
  notify();
  return profile;
}

export function revokeEditorProfile(username: string): boolean {
  ensureLoaded();
  const key = username.toLowerCase();
  const before = profiles.length;
  profiles = profiles.filter((e) => e.username.toLowerCase() !== key);
  if (profiles.length < before) {
    persist();
    notify();
    return true;
  }
  return false;
}

export function incrementEditorReviews(username: string): void {
  ensureLoaded();
  const profile = getEditorProfile(username);
  if (profile) {
    profile.reviews_completed += 1;
    persist();
    notify();
  }
}
