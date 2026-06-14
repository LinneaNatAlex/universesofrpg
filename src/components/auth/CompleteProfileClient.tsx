"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  ADULT_PURCHASE_AGE,
  isMinorForPurchases,
  MIN_ACCOUNT_AGE,
} from "@/lib/account-age";
import { normalizeAuthUsername } from "@/lib/auth-profile";
import { applyOAuthProfileCompletion } from "@/lib/complete-oauth-profile";
import { safeRedirectPath } from "@/lib/post-access";
import { Sparkles } from "lucide-react";

export function CompleteProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirectPath(searchParams.get("next"));
  const { user, loading: authLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [minorPurchaseAck, setMinorPurchaseAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ageNumber = age.trim() ? Number(age) : NaN;
  const showMinorPurchaseAck =
    Number.isFinite(ageNumber) && isMinorForPurchases(Math.floor(ageNumber));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Sign in again to finish your profile.");
      return;
    }

    if (!acceptedTerms) {
      setError("Read and accept the Rights & Terms before continuing.");
      return;
    }

    setSubmitting(true);
    const result = await applyOAuthProfileCompletion(user.id, {
      username: normalizeAuthUsername(username),
      age: Math.floor(ageNumber),
      minorPurchaseAck,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push(next);
    router.refresh();
  }

  if (authLoading) {
    return (
      <div className="comic-card w-full max-w-md p-8 text-center font-comic">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="comic-card w-full max-w-md p-8 text-center space-y-4">
        <p className="text-sm text-muted">Sign in to finish setting up your account.</p>
        <Link href="/login" className="text-comic-red font-comic hover:underline text-sm">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="comic-card w-full max-w-md p-8">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-comic-red" />
        <span className="font-comic text-xl">Finish your profile</span>
      </div>
      <p className="text-sm text-muted mb-6">
        You signed in with Google. Pick a username, confirm your age, and accept our
        terms to use Universes of RPG.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm text-muted mb-1.5">Username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
            placeholder="chaz_copper"
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1.5">Age</label>
          <input
            type="number"
            required
            min={MIN_ACCOUNT_AGE}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
          />
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-background/60 px-3 py-3">
          <label className="flex items-start gap-2 text-sm text-ink leading-snug cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-comic-red"
            />
            <span>
              I have read and agree to the{" "}
              <Link href="/rights" className="text-comic-red font-comic hover:underline">
                Rights &amp; Terms
              </Link>
              .
            </span>
          </label>

          {showMinorPurchaseAck && (
            <label className="flex items-start gap-2 text-sm text-ink leading-snug cursor-pointer border-t border-dashed border-border pt-3">
              <input
                type="checkbox"
                checked={minorPurchaseAck}
                onChange={(e) => setMinorPurchaseAck(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-comic-red"
              />
              <span>
                I am under {ADULT_PURCHASE_AGE}. A parent or legal guardian has reviewed these
                terms with me and will approve any paid Shop purchases.
              </span>
            </label>
          )}
        </div>

        {error && (
          <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="comic"
          className="w-full"
          disabled={submitting || !acceptedTerms}
        >
          {submitting ? "Saving…" : "Continue to Universes of RPG"}
        </Button>
      </form>
    </div>
  );
}
