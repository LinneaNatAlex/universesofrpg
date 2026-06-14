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
  const sharedSignupReady =
    cleanUsernamePreview.length >= 3 &&
    isValidSignupBirthDate(birthDate.trim()) &&
    acceptedTerms &&
    (!showMinorPurchaseAck || minorPurchaseAck);
  const emailSignupReady =
    sharedSignupReady &&
    email.trim().length > 0 &&
    password.length >= 6;

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

  function validateSharedSignupFields(): {
    cleanUsername: string;
    birthDate: string;
  } | null {
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
    return { cleanUsername, birthDate: date };
  }

  function buildSignupDraft(): OAuthSignupDraft | null {
    const fields = validateSharedSignupFields();
    if (!fields) return null;

    return {
      username: fields.cleanUsername,
      birthDate: fields.birthDate,
      minorPurchaseAck: showMinorPurchaseAck ? minorPurchaseAck : false,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const fields = validateSharedSignupFields();
    if (!fields) return;

    if (!email.trim()) {
      setError("Enter an email to create an account with password — or use Continue with Google above.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters — or leave email/password empty and use Google.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: fields.cleanUsername,
            display_name: fields.cleanUsername,
            birth_date: fields.birthDate,
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
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-comic-red" />
        <span className="font-comic text-xl">Join free</span>
      </div>
      <p className="text-xs text-muted mb-6 leading-snug">
        Everyone picks a <strong>public username</strong> and <strong>birth date</strong> first.
        Email and password are only if you skip Google.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm text-muted mb-1.5">
            Public username <span className="text-comic-red">*</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
            placeholder="chaz_copper"
            autoComplete="username"
          />
          <p className="text-xs text-muted mt-1">
            What others see on your profile — not your Google name or email.
          </p>
        </div>

        <div>
          <label className="block text-sm text-muted mb-1.5">
            Birth date (fødselsdato) <span className="text-comic-red">*</span>
          </label>
          <input
            type="date"
            min={minSignupBirthDate()}
            max={maxSignupBirthDate()}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
          />
          <p className="text-xs text-muted mt-1">
            Pick your real date from the calendar. Used only for age rules — never shown on your
            profile.
          </p>
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
              platform. <span className="text-comic-red">*</span>
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
                terms with me and will approve any paid Shop purchases I make on this site.{" "}
                <span className="text-comic-red">*</span>
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

        <SocialAuthButtons
          mode="signup"
          disabled={loading}
          signupReady={sharedSignupReady}
          buildSignupDraft={buildSignupDraft}
          onSignupValidationError={setError}
        />

        <div className="rounded-lg border border-dashed border-border bg-background/40 px-3 py-3 space-y-3">
          <p className="text-xs font-comic text-ink">Or sign up with email</p>
          <p className="text-[11px] text-muted leading-snug -mt-1">
            Optional — leave empty if you use Google. Only fill these in for a password login.
          </p>

          <div>
            <label className="block text-sm text-muted mb-1.5">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5">Password (optional)</label>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            variant="comic"
            className="w-full"
            disabled={loading || !emailSignupReady}
          >
            {loading ? "Creating…" : "Create account with email"}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-comic-red font-comic hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
