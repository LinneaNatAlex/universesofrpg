"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/post-access";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "auth") {
      const origin = window.location.origin;
      const isPreviewDeploy = origin.includes("--universofrpg.netlify.app");
      setError(
        isPreviewDeploy
          ? "Google login failed on this Netlify preview link. Open https://universofrpg.netlify.app/login instead, or add this preview URL to Supabase Redirect URLs."
          : "Login failed. Try again, or use email and password. If you used Google, confirm Supabase Redirect URLs include https://universofrpg.netlify.app/**"
      );
    } else if (err === "cancelled") {
      setError("Sign-in cancelled. You can try again or use email instead.");
    }
    setRedirectTo(safeRedirectPath(params.get("next")));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      await supabase.auth.getSession();
      router.refresh();
      router.push(redirectTo);
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
          <span className="font-comic text-xl">Sign in</span>
        </div>

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
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm text-muted">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-comic-red font-comic hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" variant="comic" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6">
          <SocialAuthButtons mode="login" redirectTo={redirectTo} disabled={loading} />
          <p className="mt-3 text-[11px] text-muted text-center leading-snug">
            First time here?{" "}
            <Link href="/signup" className="text-comic-red font-comic hover:underline">
              Sign up
            </Link>{" "}
            first to choose your public username before using Google.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          New adventurer?{" "}
          <Link href="/signup" className="text-comic-red font-comic hover:underline">
            Join free
          </Link>
        </p>
    </div>
  );
}
