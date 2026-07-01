"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Mail, Plus, X } from "lucide-react";
import { usePrivateMessages } from "@/contexts/PrivateMessagesContext";
import { useConversations } from "@/hooks/useConversations";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { ChatThread } from "@/components/messages/ChatThread";
import { ConversationList } from "@/components/messages/ConversationList";
import { cn } from "@/lib/utils";

export function PrivateMessagesBubble() {
  const identity = useActingIdentity();
  const username = identity?.username ?? null;
  const { isOpen, activeConversationId, openInbox, close, openConversation } =
    usePrivateMessages();
  const { unread } = useConversations(username);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!username) return null;

  return (
    <>
      <button
        type="button"
        onClick={openInbox}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center",
          "border-2 border-ink bg-surface text-ink",
          "shadow-[2px_2px_0_#1a1a2e] hover:bg-comic-yellow",
          "hover:shadow-[1px_1px_0_#1a1a2e] hover:translate-x-0.5 hover:translate-y-0.5 transition-all",
        )}
        aria-label="Privat chat"
        title="Privat chat"
      >
        <Mail className="h-4 w-4" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-ink bg-comic-red px-0.5 text-[9px] font-comic text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[70] bg-ink/40 md:bg-ink/25"
            aria-label="Lukk privat chat"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Privat chat"
            className={cn(
              "fixed z-[71] flex flex-col overflow-hidden",
              "border-2 border-ink bg-surface shadow-[4px_4px_0_#1a1a2e]",
              "inset-x-2 top-[max(0.5rem,env(safe-area-inset-top,0px))]",
              "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:inset-auto",
              "md:right-4 md:bottom-4 md:left-auto md:top-auto",
              "md:h-[min(32rem,calc(100vh-6rem))] md:w-[min(42rem,calc(100vw-2rem))]",
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b-2 border-ink bg-comic-yellow px-3 py-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {activeConversationId && (
                  <button
                    type="button"
                    onClick={() => openConversation(null)}
                    className="md:hidden flex h-8 w-8 items-center justify-center border-2 border-ink bg-surface hover:bg-comic-yellow"
                    aria-label="Tilbake til samtaler"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <h2 className="font-comic text-sm sm:text-base truncate">
                  {activeConversationId ? "Samtale" : "Privat chat"}
                </h2>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href="/messages/new"
                  onClick={close}
                  className="hidden sm:inline-flex h-8 items-center gap-1 border-2 border-ink bg-surface px-2 text-xs font-comic hover:bg-comic-yellow"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Gruppe
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-8 w-8 items-center justify-center border-2 border-ink bg-surface hover:bg-comic-yellow"
                  aria-label="Lukk"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 min-h-0">
              <aside
                className={cn(
                  "w-full md:w-44 lg:w-52 shrink-0 border-r-2 border-ink overflow-y-auto",
                  activeConversationId ? "hidden md:block" : "block",
                )}
              >
                <ConversationList
                  activeId={activeConversationId ?? undefined}
                  mode="select"
                  onSelect={(id) => openConversation(id)}
                  emptyHint="Ingen samtaler ennå. Gå til en profil og trykk Snakk privat."
                />
              </aside>

              <div
                className={cn(
                  "flex-1 min-w-0 min-h-0",
                  !activeConversationId ? "hidden md:flex md:flex-col" : "flex flex-col",
                )}
              >
                {activeConversationId ? (
                  <ChatThread
                    conversationId={activeConversationId}
                    embedded
                    onLeave={() => openConversation(null)}
                  />
                ) : (
                  <div className="hidden md:flex flex-1 items-center justify-center p-6 text-center text-sm text-ink-muted font-comic">
                    Velg en samtale, eller besøk en profil og trykk Snakk privat.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
