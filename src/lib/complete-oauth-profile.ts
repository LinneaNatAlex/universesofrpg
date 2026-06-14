import {
  ADULT_PURCHASE_AGE,
  ageFromBirthDate,
  isMinorForPurchases,
  isValidSignupBirthDate,
  TERMS_VERSION,
} from "@/lib/account-age";
import { normalizeAuthUsername } from "@/lib/auth-profile";
import { createClient } from "@/lib/supabase/client";
import type { OAuthSignupDraft } from "@/lib/oauth-signup-draft";

export interface CompleteProfileInput {
  username: string;
  birthDate: string;
  minorPurchaseAck: boolean;
}

export async function applyOAuthProfileCompletion(
  userId: string,
  input: CompleteProfileInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cleanUsername = normalizeAuthUsername(input.username);
  if (cleanUsername.length < 3) {
    return { ok: false, error: "Username must be at least 3 characters (a-z, 0-9, _)." };
  }

  const birthDate = input.birthDate.trim();
  if (!isValidSignupBirthDate(birthDate)) {
    return { ok: false, error: "Enter a valid birth date to continue." };
  }

  const age = ageFromBirthDate(birthDate);
  const showMinorAck = isMinorForPurchases(age);
  if (showMinorAck && !input.minorPurchaseAck) {
    return {
      ok: false,
      error: `If you are under ${ADULT_PURCHASE_AGE}, confirm guardian approval for Shop purchases.`,
    };
  }

  const supabase = createClient();

  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      username: cleanUsername,
      display_name: cleanUsername,
      birth_date: birthDate,
      terms_accepted_at: new Date().toISOString(),
      terms_version: TERMS_VERSION,
      minor_purchase_rules_acknowledged: showMinorAck ? input.minorPurchaseAck : false,
      profile_completed: true,
    },
  });

  if (metaError) {
    return { ok: false, error: metaError.message };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      username: cleanUsername,
      display_name: cleanUsername,
    })
    .eq("id", userId);

  if (profileError) {
    if (profileError.code === "23505") {
      return {
        ok: false,
        error: "That username is already taken. Pick another and try again.",
      };
    }
    return { ok: false, error: profileError.message };
  }

  return { ok: true };
}

export function draftToProfileInput(draft: OAuthSignupDraft): CompleteProfileInput {
  return {
    username: draft.username,
    birthDate: draft.birthDate,
    minorPurchaseAck: draft.minorPurchaseAck,
  };
}
