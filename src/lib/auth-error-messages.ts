/** Friendlier copy for common Supabase Auth errors. */
export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("email rate limit exceeded")) {
    return "Too many confirmation emails sent recently. Wait about an hour and try again, or sign in if you already registered. For production, set up custom SMTP in Supabase (Authentication → SMTP).";
  }

  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  return message;
}
