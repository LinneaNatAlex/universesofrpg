"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";

const PUBLIC_ROUTES = ["/", "/explore", "/marketplace", "/discussions", "/about", "/faq"] as const;
const AUTH_ROUTES = ["/create", "/forum", "/messages", "/settings"] as const;

/** Warm route bundles after first paint so tab switches feel instant. */
export function NavPrefetch() {
  const router = useRouter();
  const { isLoggedIn } = useAdmin();

  useEffect(() => {
    const run = () => {
      for (const href of PUBLIC_ROUTES) {
        router.prefetch(href);
      }
      if (isLoggedIn) {
        for (const href of AUTH_ROUTES) {
          router.prefetch(href);
        }
        void import("@/components/forum/ForumList");
      }
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(run, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }

    const timer = window.setTimeout(run, 400);
    return () => window.clearTimeout(timer);
  }, [router, isLoggedIn]);

  return null;
}
