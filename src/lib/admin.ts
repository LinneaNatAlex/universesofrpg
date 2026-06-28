import type { User } from "@supabase/supabase-js";

/** Comma-separated admin emails — NEXT_PUBLIC_* for client; ADMIN_EMAILS for server-only fallback. */
export function getAdminEmails(): string[] {
  const raw =
    process.env.ADMIN_EMAILS ??
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ??
    "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: User | null): boolean {
  if (!user?.email) return false;

  const admins = getAdminEmails();
  if (admins.length === 0) return false;

  return admins.includes(user.email.toLowerCase());
}
