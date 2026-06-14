import { parseUserAge } from "@/lib/account-age";

export function hasAcceptedTerms(metadata: Record<string, unknown> | undefined): boolean {
  return typeof metadata?.terms_accepted_at === "string" && metadata.terms_accepted_at.length > 0;
}

export function hasCompletedProfile(metadata: Record<string, unknown> | undefined): boolean {
  return metadata?.profile_completed === true;
}

/** OAuth or legacy accounts missing required signup fields. */
export function needsProfileCompletion(
  metadata: Record<string, unknown> | undefined
): boolean {
  if (hasCompletedProfile(metadata)) return false;
  return (
    !hasAcceptedTerms(metadata) ||
    parseUserAge(metadata) == null ||
    typeof metadata?.username !== "string" ||
    metadata.username.length < 3
  );
}

export function normalizeAuthUsername(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

/** Public identity — never fall back to email or OAuth provider names. */
export function resolvePublicUsername(
  metadata: Record<string, unknown> | undefined,
  dbUsername: string | null
): string {
  if (dbUsername) return dbUsername.toLowerCase();
  if (typeof metadata?.username === "string" && metadata.username.trim().length >= 3) {
    return metadata.username.trim().toLowerCase();
  }
  return "adventurer";
}

export function resolvePublicDisplayName(
  username: string,
  metadata: Record<string, unknown> | undefined
): string {
  if (typeof metadata?.display_name === "string") {
    const chosen = metadata.display_name.trim();
    if (chosen) return chosen;
  }
  return username;
}
