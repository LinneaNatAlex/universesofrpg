/** True when Supabase Auth failed due to network/offline — not an invalid session. */
export function isAuthNetworkError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof TypeError && error.message.includes("fetch")) return true;
  if (typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message).toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("network request failed") ||
      message.includes("load failed")
    );
  }
  return false;
}

export function isRetryableAuthFailure(error: unknown): boolean {
  return isAuthNetworkError(error);
}
