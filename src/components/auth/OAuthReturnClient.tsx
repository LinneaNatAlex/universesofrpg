"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { needsProfileCompletion } from "@/lib/auth-profile";
import {
  applyOAuthProfileCompletion,
  draftToProfileInput,
} from "@/lib/complete-oauth-profile";
import {
  clearOAuthSignupDraft,
  readOAuthSignupDraft,
} from "@/lib/oauth-signup-draft";
import { safeRedirectPath } from "@/lib/post-access";
import { createClient } from "@/lib/supabase/client";

export function OAuthReturnClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirectPath(searchParams.get("next"));
  const [message, setMessage] = useState("Finishing sign-in…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const supabase = createClient();

      let user = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        const {
          data: { user: current },
        } = await supabase.auth.getUser();
        if (current) {
          user = current;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      if (cancelled) return;

      if (!user) {
        router.replace(`/login?error=auth&next=${encodeURIComponent(next)}`);
        return;
      }

      const draft = readOAuthSignupDraft();
      if (draft) {
        setMessage("Saving your profile…");
        const result = await applyOAuthProfileCompletion(
          user.id,
          draftToProfileInput(draft)
        );

        if (cancelled) return;

        if (!result.ok) {
          setError(result.error);
          return;
        }

        clearOAuthSignupDraft();
        router.replace(next);
        router.refresh();
        return;
      }

      if (needsProfileCompletion(user.user_metadata)) {
        router.replace(`/complete-profile?next=${encodeURIComponent(next)}`);
        return;
      }

      router.replace(next);
      router.refresh();
    }

    void finish();

    return () => {
      cancelled = true;
    };
  }, [router, next]);

  return (
    <div className="comic-card w-full max-w-md p-8 text-center space-y-4">
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="h-5 w-5 text-comic-red" />
        <span className="font-comic text-xl">Almost there</span>
      </div>
      {error ? (
        <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted">{message}</p>
      )}
    </div>
  );
}
