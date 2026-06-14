"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeRedirectPath } from "@/lib/post-access";
import { createClient } from "@/lib/supabase/client";

function readHashError(): string | null {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return params.get("error");
}

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const next = safeRedirectPath(searchParams.get("next"));
      const loginWithNext = `/login?next=${encodeURIComponent(next)}`;

      const hashError = readHashError();
      const queryError = searchParams.get("error");
      const oauthError = hashError ?? queryError;

      if (oauthError) {
        const dest =
          oauthError === "access_denied"
            ? `${loginWithNext}&error=cancelled`
            : `${loginWithNext}&error=auth`;
        router.replace(dest);
        return;
      }

      const code = searchParams.get("code");
      if (!code) {
        router.replace(`${loginWithNext}&error=cancelled`);
        return;
      }

      setMessage("Verifying your sign-in…");
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (cancelled) return;

      if (error) {
        router.replace(`${loginWithNext}&error=auth`);
        return;
      }

      router.replace(`/oauth-return?next=${encodeURIComponent(next)}`);
      router.refresh();
    }

    void finish();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="comic-card w-full max-w-md p-8 text-center">
      <p className="text-sm text-muted font-comic">{message}</p>
    </div>
  );
}
