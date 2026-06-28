"use client";

import { useEffect, useState } from "react";
import {
  PLATFORM_SYNC_FAILED_EVENT,
  PLATFORM_SYNC_OK_EVENT,
} from "@/lib/platform-sync-events";

/**
 * Shows when platform content failed to reach Supabase — explains why others cannot see changes.
 */
export function LiveSyncBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function onFailed(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      setMessage(typeof detail === "string" ? detail : "Could not sync to live server.");
    }

    function onOk() {
      setMessage(null);
    }

    window.addEventListener(PLATFORM_SYNC_FAILED_EVENT, onFailed);
    window.addEventListener(PLATFORM_SYNC_OK_EVENT, onOk);
    return () => {
      window.removeEventListener(PLATFORM_SYNC_FAILED_EVENT, onFailed);
      window.removeEventListener(PLATFORM_SYNC_OK_EVENT, onOk);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="border-b-4 border-ink bg-comic-red text-white px-4 py-2.5 text-sm font-comic text-center"
    >
      {message}
    </div>
  );
}
