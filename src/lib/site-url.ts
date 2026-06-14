/** Canonical public site URL for auth emails (signup confirm, password reset). */
export function getPublicSiteUrl(fallbackOrigin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (fallbackOrigin) {
    return fallbackOrigin.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

/** Email confirm / password reset — prefers NEXT_PUBLIC_SITE_URL on Netlify. */
export function authCallbackUrl(fallbackOrigin?: string): string {
  const base = getPublicSiteUrl(fallbackOrigin);
  return base ? `${base}/auth/callback` : "/auth/callback";
}

/** Google OAuth return — always the page you are on (never NEXT_PUBLIC_SITE_URL). */
export function oauthCallbackUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/auth/callback`;
}
