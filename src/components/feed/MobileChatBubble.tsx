"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { HomepageChat } from "@/components/feed/HomepageChat";
import { cn } from "@/lib/utils";

export function MobileChatBubble() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-3 z-50 flex h-12 w-12 items-center justify-center",
          "border-2 border-ink bg-comic-red text-white shadow-[3px_3px_0_#1a1a2e]",
          "hover:shadow-[2px_2px_0_#1a1a2e] hover:translate-x-0.5 hover:translate-y-0.5 transition-all",
          "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]"
        )}
        aria-label="Open chat"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-ink/45"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Chat"
            className={cn(
              "fixed inset-x-2 z-[61] flex flex-col overflow-hidden",
              "border-2 border-ink bg-surface shadow-[4px_4px_0_#1a1a2e]",
              "top-[max(0.5rem,env(safe-area-inset-top,0px))]",
              "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]"
            )}
          >
            <div className="flex items-center justify-end shrink-0 border-b-2 border-ink bg-comic-yellow px-2 py-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center border-2 border-ink bg-surface hover:bg-comic-yellow"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <HomepageChat className="flex-1 min-h-0 h-full !shadow-none !border-0 rounded-none" />
          </div>
        </>
      )}
    </div>
  );
}
