import { createClient } from "@/lib/supabase/client";
import { oauthCallbackUrl } from "@/lib/site-url";
import { safeRedirectPath } from "@/lib/post-access";
import { getSupabaseUrl } from "@/lib/supabase/env";

export type OAuthProvider = "google";

export function buildOAuthRedirectUrl(nextPath: string, origin: string): string {
  const next = encodeURIComponent(safeRedirectPath(nextPath));
  return `${oauthCallbackUrl(origin)}?next=${next}`;
}

function validateOAuthStartUrl(url: string): string | null {
  const projectUrl = getSupabaseUrl()?.replace(/\/$/, "");
  if (!projectUrl) {
    return "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL on Netlify.";
  }

  if (url.includes("app.supabase.com") || url.includes("supabase.com/dashboard")) {
    return "OAuth URL points to the Supabase dashboard — check NEXT_PUBLIC_SUPABASE_URL (must be https://YOUR-PROJECT.supabase.co).";
  }

  if (!url.startsWith(`${projectUrl}/auth/v1/authorize`)) {
    return `Unexpected OAuth URL. NEXT_PUBLIC_SUPABASE_URL should be your project, e.g. ${projectUrl}.`;
  }

  return null;
}

export async function signInWithOAuthProvider(
  provider: OAuthProvider,
  nextPath = "/"
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const redirectTo = buildOAuthRedirectUrl(nextPath, window.location.origin);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { error: error.message };
  }

  const startUrl = data?.url;
  if (!startUrl) {
    return {
      error:
        "Google sign-in could not start. Enable Google under Supabase → Authentication → Providers (Client ID + Secret).",
    };
  }

  const urlError = validateOAuthStartUrl(startUrl);
  if (urlError) {
    return { error: urlError };
  }

  window.location.assign(startUrl);
  return { error: null };
}
