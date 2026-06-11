"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!cancelled) {
          setHasSession(!!session);
        }
      } catch {
        if (!cancelled) setHasSession(false);
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({ password });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Supabase is not configured. Check .env.local");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="comic-card w-full max-w-md p-8 text-center text-sm text-muted">
        Checking reset link…
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="comic-card w-full max-w-md p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-comic-red" />
          <span className="font-comic text-xl">Reset link expired</span>
        </div>
        <p className="text-sm text-muted">
          This password reset link is invalid or has expired. Request a new one below.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-comic-red font-comic text-sm hover:underline"
        >
          Send a new reset link →
        </Link>
        <p className="text-center text-sm text-muted pt-2">
          <Link href="/login" className="text-comic-red font-comic hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="comic-card w-full max-w-md p-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-comic-red" />
        <span className="font-comic text-xl">Choose new password</span>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm text-muted mb-1.5">New password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1.5">Confirm password</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" variant="comic" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
