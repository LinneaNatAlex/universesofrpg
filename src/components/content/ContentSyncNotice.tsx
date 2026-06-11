"use client";

import { useEffect, useState } from "react";
import {
  CONTENT_SYNC_FAILED_EVENT,
  type ContentSyncFailure,
} from "@/lib/content-sync";

export function ContentSyncNotice() {
  const [failure, setFailure] = useState<ContentSyncFailure | null>(null);

  useEffect(() => {
    function onFailed(event: Event) {
      const detail = (event as CustomEvent<ContentSyncFailure>).detail;
      if (detail) setFailure(detail);
    }

    window.addEventListener(CONTENT_SYNC_FAILED_EVENT, onFailed);
    return () => window.removeEventListener(CONTENT_SYNC_FAILED_EVENT, onFailed);
  }, []);

  if (!failure) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 border-2 border-ink bg-comic-red text-white px-4 py-3 shadow-[4px_4px_0_#1a1a2e] text-sm font-comic"
    >
      <p className="font-comic text-base mb-1">Not saved live</p>
      <p className="opacity-95 leading-snug">{failure.error}</p>
      <button
        type="button"
        onClick={() => setFailure(null)}
        className="mt-2 underline text-comic-yellow"
      >
        Dismiss
      </button>
    </div>
  );
}
