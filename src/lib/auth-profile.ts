import { parseUserAge } from "@/lib/account-age";

export function hasAcceptedTerms(metadata: Record<string, unknown> | undefined): boolean {
  return typeof metadata?.terms_accepted_at === "string" && metadata.terms_accepted_at.length > 0;
}

/** OAuth or legacy accounts missing required signup fields. */
export function needsProfileCompletion(
  metadata: Record<string, unknown> | undefined
): boolean {
  return !hasAcceptedTerms(metadata) || parseUserAge(metadata) == null;
}

export function normalizeAuthUsername(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}
