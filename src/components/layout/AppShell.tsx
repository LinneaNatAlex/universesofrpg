"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Home,
  LogOut,
  PenTool,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/marketplace", label: "Market", icon: ShoppingBag },
  { href: "/editor", label: "Forge", icon: PenTool },
  { href: "/explore", label: "Explore", icon: Compass },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const profileHref = user
    ? `/profile/${user.user_metadata?.username ?? "me"}`
    : "/login";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-foreground">
                Universes
              </span>
              <span className="ml-1 text-sm text-violet-400">of RPG</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-violet-500/15 text-violet-300"
                      : "text-muted hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {!loading && !isLoggedIn && (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline text-sm text-muted hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors shadow-[0_0_16px_rgba(124,58,237,0.3)]"
                >
                  Join the realm
                </Link>
              </>
            )}
            {!loading && isLoggedIn && (
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            )}
            <Link
              href={profileHref}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated text-muted hover:text-violet-300 hover:border-violet-500/40 transition-colors"
              title={isLoggedIn ? "Your profile" : "Sign in"}
            >
              <User className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="flex justify-around py-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-xs",
                  active ? "text-violet-400" : "text-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
