import { deleteVerificationSubscription } from "@/lib/verification-payments-store";
import { clearPendingVerificationCheckoutForUser } from "@/lib/verification-checkout-pending";
import { adminRevokeVerifiedCreator } from "@/lib/verified-creators-store";

export const VERIFICATION_UPDATED_EVENT = "uorpg-verification-updated";

function notifyVerificationUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(VERIFICATION_UPDATED_EVENT));
}

/**
 * Remove verified badge globally (server) and on this browser.
 * Requires admin sign-in + SUPABASE_SERVICE_ROLE_KEY on the server for production.
 */
export async function adminRevokeVerifiedAccess(
  username: string
): Promise<{ ok: boolean; global: boolean; error?: string }> {
  const key = username.toLowerCase();

  try {
    const res = await fetch("/api/admin/verification/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: key }),
    });

    if (res.ok) {
      adminRevokeVerifiedCreator(key);
      deleteVerificationSubscription(key);
      clearPendingVerificationCheckoutForUser(key);
      notifyVerificationUpdated();
      return { ok: true, global: true };
    }

    const data = (await res.json().catch(() => ({}))) as { error?: string };

    if (res.status === 503 || res.status === 401 || res.status === 403) {
      adminRevokeVerifiedCreator(key);
      deleteVerificationSubscription(key);
      clearPendingVerificationCheckoutForUser(key);
      notifyVerificationUpdated();
      return {
        ok: true,
        global: false,
        error:
          data.error ??
          "Removed on this browser only. Add SUPABASE_SERVICE_ROLE_KEY on the server so everyone sees the change.",
      };
    }

    return { ok: false, global: false, error: data.error ?? "Could not revoke verified access." };
  } catch {
    adminRevokeVerifiedCreator(key);
    deleteVerificationSubscription(key);
    clearPendingVerificationCheckoutForUser(key);
    notifyVerificationUpdated();
    return {
      ok: true,
      global: false,
      error: "Server unreachable — removed on this browser only.",
    };
  }
}
