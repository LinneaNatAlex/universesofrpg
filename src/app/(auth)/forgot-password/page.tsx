"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setMessage(
        "If an account exists for that email, we sent a reset link. Check your inbox and spam folder."
      );
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
        <span className="font-comic text-xl">Forgot password</span>
      </div>

      <p className="text-sm text-muted mb-4">
        Enter your email and we&apos;ll send you a link to choose a new password.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm text-muted mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
            placeholder="you@example.com"
            autoComplete="email"
          />
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

        <Button type="submit" variant="comic" className="w-full" disabled={loading || !!message}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="text-comic-red font-comic hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
