"use client";

import { useEffect, useState } from "react";
import { fetchPostSourceCode } from "@/lib/post-source-code-client";
import { getVaultedCode, type PostCodeBundle } from "@/lib/post-code-vault";
import { subscribePurchases } from "@/lib/purchases-store";

/**
 * Load template source for viewing / editing.
 * Uses the local vault immediately when present — never replaces it with a slow server fetch.
 */
export function usePostSourceCode(
  postId: string,
  enabled: boolean,
  actingUsername?: string | null,
  /** When true, always fetch from server (buyers on a new device). Authors should pass false. */
  serverOnly = false
) {
  const [bundle, setBundle] = useState<PostCodeBundle | null>(() => {
    if (serverOnly || typeof window === "undefined") return null;
    return getVaultedCode(postId);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseTick, setPurchaseTick] = useState(0);

  useEffect(() => subscribePurchases(() => setPurchaseTick((n) => n + 1)), []);

  useEffect(() => {
    if (!enabled) {
      setBundle(null);
      setError(null);
      setLoading(false);
      return;
    }

    const local = serverOnly ? null : getVaultedCode(postId);
    if (local) {
      setBundle(local);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchPostSourceCode(postId, actingUsername).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setBundle(result.bundle);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [postId, enabled, actingUsername, serverOnly, purchaseTick]);

  return { bundle, loading, error };
}
