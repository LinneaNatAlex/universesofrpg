"use client";

import Link from "next/link";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { useVerificationCheckoutReturn } from "@/hooks/useVerificationCheckoutReturn";

/** Confirms Stripe Payment Link return on any page (home, settings, etc.). */
export function VerificationCheckoutReturn() {
  const { confirming, error, successMessage, dismiss } = useVerificationCheckoutReturn();

  if (!confirming && !error && !successMessage) return null;

  return (
    <div
      className="border-b-4 border-ink px-4 py-3 text-sm"
      role="status"
      aria-live="polite"
    >
      {confirming && (
        <p className="font-comic text-ink flex items-center gap-2 justify-center">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Confirming your payment…
        </p>
      )}
      {successMessage && !confirming && (
        <div className="flex items-start justify-between gap-3 max-w-3xl mx-auto bg-comic-yellow/50 border-2 border-ink px-3 py-2">
          <p className="font-comic text-ink flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-comic-red shrink-0" />
            {successMessage}{" "}
            <Link href="/settings?tab=applications" className="text-comic-red hover:underline">
              View settings
            </Link>
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="text-ink-muted hover:text-comic-red shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && !confirming && (
        <div className="flex items-start justify-between gap-3 max-w-3xl mx-auto bg-comic-red/10 border-2 border-comic-red px-3 py-2">
          <p className="text-comic-red font-comic">{error}</p>
          <button
            type="button"
            onClick={dismiss}
            className="text-ink-muted hover:text-comic-red shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
