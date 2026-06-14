import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl } from "@/lib/site-url";
import { safeRedirectPath } from "@/lib/post-access";

export type OAuthProvider = "google" | "facebook";

export function buildOAuthRedirectUrl(nextPath: string, origin: string): string {
  const next = encodeURIComponent(safeRedirectPath(nextPath));
  return `${authCallbackUrl(origin)}?next=${next}`;
}

export async function signInWithOAuthProvider(
  provider: OAuthProvider,
  nextPath = "/"
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const origin = window.location.origin;
  const redirectTo = buildOAuthRedirectUrl(nextPath, origin);

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  return { error: error?.message ?? null };
}
