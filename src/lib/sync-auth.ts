"use client";

import { createClient } from "@/lib/supabase/client";
import { isRetryableAuthFailure } from "@/lib/supabase/auth-errors";

/** Wait until Supabase exposes an access token (or timeout). */
export async function waitForAuthToken(maxMs = 4_000): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const supabase = createClient();
  const deadline = Date.now() + maxMs;

  while (Date.now() < deadline) {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error && isRetryableAuthFailure(error)) return null;
      if (session?.access_token) return session.access_token;
    } catch (error) {
      if (isRetryableAuthFailure(error)) return null;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  return null;
}

export async function authHeadersForSync(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = await waitForAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}
