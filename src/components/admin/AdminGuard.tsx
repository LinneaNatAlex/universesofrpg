"use client";

import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { LoginCTA } from "@/components/auth/LoginCTA";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { loading, isLoggedIn, isAdmin, user } = useAdmin();

  if (loading) {
    return (
      <div className="comic-panel p-12 text-center font-comic text-ink-muted">
        Checking access…
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="font-comic text-2xl text-ink text-center">Admin Panel</h1>
        <LoginCTA message="Sign in with an admin account to continue." />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="comic-panel p-8 max-w-md mx-auto text-center space-y-3">
        <h1 className="font-comic text-xl text-comic-red">Access denied</h1>
        <p className="text-sm text-ink-muted">
          <strong>{user?.email}</strong> is not an admin.
        </p>
        <p className="text-xs text-ink-muted">
          Add your email to <code className="bg-surface px-1">NEXT_PUBLIC_ADMIN_EMAILS</code> in
          .env.local and restart the server.
        </p>
        <Link href="/" className="font-comic text-comic-red hover:underline text-sm">
          ← Back to feed
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
