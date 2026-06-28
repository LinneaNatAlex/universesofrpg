import type { EditorsPlatformState } from "@/app/api/content/editors/route";
import type { EditorLevel, EditorProfile } from "@/types/database";

const LEVELS = new Set<EditorLevel>([
  "junior",
  "standard",
  "senior",
  "admin_verified",
]);

function sanitizeProfile(raw: unknown): EditorProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const username =
    typeof p.username === "string" ? p.username.trim().toLowerCase() : "";
  if (username.length < 2 || username.length > 32) return null;

  const level = p.level as EditorLevel;
  if (!LEVELS.has(level)) return null;

  const displayName =
    typeof p.display_name === "string" && p.display_name.trim().length > 0
      ? p.display_name.trim().slice(0, 80)
      : username;

  return {
    username,
    display_name: displayName,
    level,
    rate_cents_min:
      typeof p.rate_cents_min === "number" && p.rate_cents_min >= 0
        ? Math.round(p.rate_cents_min)
        : 0,
    rate_cents_max:
      typeof p.rate_cents_max === "number" && p.rate_cents_max >= 0
        ? Math.round(p.rate_cents_max)
        : 0,
    trust_score:
      typeof p.trust_score === "number"
        ? Math.min(100, Math.max(0, Math.round(p.trust_score)))
        : 75,
    reviews_completed:
      typeof p.reviews_completed === "number" && p.reviews_completed >= 0
        ? Math.round(p.reviews_completed)
        : 0,
    granted_at:
      typeof p.granted_at === "string" && p.granted_at.length > 0
        ? p.granted_at
        : new Date().toISOString(),
    granted_by:
      typeof p.granted_by === "string" && p.granted_by.trim().length > 0
        ? p.granted_by.trim().slice(0, 64)
        : "admin",
  };
}

export function sanitizeEditorsPlatformState(
  state: EditorsPlatformState
): EditorsPlatformState {
  const byUsername = new Map<string, EditorProfile>();
  for (const raw of state.profiles ?? []) {
    const profile = sanitizeProfile(raw);
    if (!profile) continue;
    byUsername.set(profile.username, profile);
  }
  return {
    profiles: [...byUsername.values()].sort(
      (a, b) => new Date(b.granted_at).getTime() - new Date(a.granted_at).getTime()
    ),
  };
}
