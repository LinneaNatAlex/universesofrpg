"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { isRetryableAuthFailure } from "@/lib/supabase/auth-errors";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Survives hot reload so auth does not re-enter loading on every save. */
const authBootCache: { bootstrapped: boolean; user: User | null } = {
  bootstrapped: false,
  user: null,
};

function finishBootstrap(
  nextUser: User | null,
  setUser: (user: User | null) => void,
  setLoading: (loading: boolean) => void,
  initialLoadDone: { current: boolean }
) {
  authBootCache.user = nextUser;
  authBootCache.bootstrapped = true;
  setUser(nextUser);
  initialLoadDone.current = true;
  setLoading(false);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(() => authBootCache.user);
  const [loading, setLoading] = useState(() => !authBootCache.bootstrapped);
  const initialLoadDone = useRef(authBootCache.bootstrapped);

  useEffect(() => {
    if (authBootCache.bootstrapped) {
      setUser(authBootCache.user);
      setLoading(false);
      initialLoadDone.current = true;
      return;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      finishBootstrap(null, setUser, setLoading, initialLoadDone);
      return;
    }

    let supabase;
    try {
      supabase = createClient();
    } catch {
      finishBootstrap(null, setUser, setLoading, initialLoadDone);
      return;
    }

    void supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error && isRetryableAuthFailure(error)) {
          finishBootstrap(authBootCache.user, setUser, setLoading, initialLoadDone);
          return;
        }
        finishBootstrap(session?.user ?? null, setUser, setLoading, initialLoadDone);
      })
      .catch((error: unknown) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("[auth] getSession unavailable:", error);
        }
        finishBootstrap(authBootCache.user, setUser, setLoading, initialLoadDone);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!initialLoadDone.current) return;

      const nextUser = session?.user ?? null;
      authBootCache.user = nextUser;
      setUser(nextUser);

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
