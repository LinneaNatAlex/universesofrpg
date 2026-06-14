"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-error-messages";
import { authCallbackUrl } from "@/lib/site-url";
import {
  ADULT_PURCHASE_AGE,
  ageFromBirthDate,
  isMinorForPurchases,
  isValidSignupBirthDate,
  maxSignupBirthDate,
  minSignupBirthDate,
  MIN_ACCOUNT_AGE,
  TERMS_VERSION,
} from "@/lib/account-age";
import { normalizeAuthUsername } from "@/lib/auth-profile";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import type { OAuthSignupDraft } from "@/lib/oauth-signup-draft";
import { Sparkles } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [minorPurchaseAck, setMinorPurchaseAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signupAge = birthDate ? ageFromBirthDate(birthDate) : null;
  const showMinorPurchaseAck =
    signupAge != null && isMinorForPurchases(signupAge);
  const cleanUsernamePreview = normalizeAuthUsername(username);
  const googleSignupReady =
    cleanUsernamePreview.length >= 3 &&
    Boolean(birthDate.trim()) &&
    acceptedTerms &&
    (!showMinorPurchaseAck || minorPurchaseAck);

  function validateBirthDate(): string | null {
    const value = birthDate.trim();
    if (!isValidSignupBirthDate(value)) {
      setError(
        `Pick a valid birth date — you must be at least ${MIN_ACCOUNT_AGE}. You cannot register by typing an age number.`
      );
      return null;
    }
    return value;
  }

  function buildSignupDraft(): OAuthSignupDraft | null {
    const cleanUsername = normalizeAuthUsername(username);
    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters (a-z, 0-9, _)");
      return null;
    }

    const date = validateBirthDate();
    if (!date) return null;

    if (!acceptedTerms) {
      setError("Read and accept the Rights & Terms before creating an account.");
      return null;
    }

    if (showMinorPurchaseAck && !minorPurchaseAck) {
      setError(
        `If you are under ${ADULT_PURCHASE_AGE}, confirm that a parent or guardian has reviewed the terms and will approve any Shop purchases.`
      );
      return null;
    }

    setError(null);
    return {
      username: cleanUsername,
      birthDate: date,
      minorPurchaseAck: showMinorPurchaseAck ? minorPurchaseAck : false,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const cleanUsername = normalizeAuthUsername(username);
    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters (a-z, 0-9, _)");
      setLoading(false);
      return;
    }

    const date = validateBirthDate();
    if (!date) {
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError("Read and accept the Rights & Terms before creating an account.");
      setLoading(false);
      return;
    }

    if (showMinorPurchaseAck && !minorPurchaseAck) {
      setError(
        `If you are under ${ADULT_PURCHASE_AGE}, confirm that a parent or guardian has reviewed the terms and will approve any Shop purchases.`
      );
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanUsername,
            birth_date: date,
            terms_accepted_at: new Date().toISOString(),
            terms_version: TERMS_VERSION,
            minor_purchase_rules_acknowledged: showMinorPurchaseAck
              ? minorPurchaseAck
              : false,
            profile_completed: true,
          },
          emailRedirectTo: authCallbackUrl(window.location.origin),
        },
      });

      if (authError) {
        setError(formatAuthError(authError.message));
        return;
      }

      if (data.session) {
        router.push("/");
        router.refresh();
        return;
      }

      setMessage("Check your email to confirm your account, then sign in.");
    } catch {
      setError("Supabase is not configured. Check .env.local");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="comic-card w-full max-w-md p-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-comic-red" />
        <span className="font-comic text-xl">Join free</span>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm text-muted mb-1.5">Public username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
            placeholder="chaz_copper"
          />
          <p className="text-xs text-muted mt-1">
            This is your public name on the site — not your Google name or email. Required before
            &quot;Continue with Google&quot;.
          </p>
        </div>
        <div>
          <label className="block text-sm text-muted mb-1.5">Birth date (fødselsdato)</label>
          <input
            type="date"
            required
            min={minSignupBirthDate()}
            max={maxSignupBirthDate()}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
          />
          <p className="text-xs text-muted mt-1">
            Pick your real date of birth from the calendar — you cannot just type &quot;13&quot; or
            any age number. Used only for age rules; never shown on your profile.
          </p>
        </div>
        <div>
          <label className="block text-sm text-muted mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1.5">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
              , including age rules, creator responsibilities, and how content may be used on the
              platform.
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
                terms with me and will approve any paid Shop purchases I make on this site.
              </span>
            </label>
          )}
        </div>

        {error && (
          <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            {message}
          </p>
        )}

        <Button
          type="submit"
          variant="comic"
          className="w-full"
          disabled={loading || !acceptedTerms}
        >
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>

      <div className="mt-6">
        <SocialAuthButtons
          mode="signup"
          disabled={loading}
          signupReady={googleSignupReady}
          buildSignupDraft={buildSignupDraft}
          onSignupValidationError={setError}
        />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-comic-red font-comic hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
