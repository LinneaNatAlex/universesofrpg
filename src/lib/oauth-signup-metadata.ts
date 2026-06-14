import { TERMS_VERSION } from "@/lib/account-age";
import type { OAuthSignupDraft } from "@/lib/oauth-signup-draft";

/** Sent with Google OAuth so Supabase creates the account with the chosen public username. */
export function buildOAuthSignupMetadata(
  draft: OAuthSignupDraft
): Record<string, string | boolean> {
  return {
    username: draft.username,
    display_name: draft.username,
    birth_date: draft.birthDate,
    terms_accepted_at: new Date().toISOString(),
    terms_version: TERMS_VERSION,
    minor_purchase_rules_acknowledged: draft.minorPurchaseAck,
    profile_completed: true,
  };
}
