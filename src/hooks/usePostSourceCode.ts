"use client";

import { useEffect, useState } from "react";
import { fetchPostSourceCode } from "@/lib/post-source-code-client";
import { getVaultedCode, type PostCodeBundle } from "@/lib/post-code-vault";

export function usePostSourceCode(postId: string, enabled: boolean) {
  const [bundle, setBundle] = useState<PostCodeBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setBundle(null);
      setError(null);
      setLoading(false);
      return;
    }

    const local = getVaultedCode(postId);
    if (local) {
      setBundle(local);
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchPostSourceCode(postId).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setBundle(result.bundle);
      } else if (!local) {
        setError(result.error);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [postId, enabled]);

  return { bundle, loading, error };
}
