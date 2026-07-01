"use client";

import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useFriendActor } from "@/hooks/useFriendActor";
import { conversationTitleForUser } from "@/lib/messages-store";
import { Badge } from "@/components/ui/badge";

interface ConversationListProps {
  activeId?: string;
  mode?: "link" | "select";
  onSelect?: (conversationId: string) => void;
  emptyHint?: string;
}

export function ConversationList({
  activeId,
  mode = "link",
  onSelect,
  emptyHint,
}: ConversationListProps) {
  const actor = useFriendActor();
  const { conversations, ready } = useConversations(actor?.username ?? null);

  if (!actor) return null;

  if (!ready) {
    return <p className="text-sm text-ink-muted font-comic p-4">Loading messages…</p>;
  }

  if (conversations.length === 0) {
    return (
      <p className="comic-panel p-6 text-sm text-ink-muted text-center">
        {emptyHint ??
          "No conversations yet. Visit a profile and tap Snakk privat, or start a group chat."}
      </p>
    );
  }

  return (
    <ul className="divide-y-2 divide-dashed divide-ink border-2 border-ink bg-surface md:border-0 md:border-r-2">
      {conversations.map((conv) => {
        const active = conv.id === activeId;
        const title = conversationTitleForUser(conv, actor.username);
        const rowClass = `flex w-full items-start gap-3 px-4 py-3 hover:bg-comic-yellow/50 transition-colors text-left ${
          active ? "bg-comic-yellow/60" : ""
        }`;

        const inner = (
          <>
            <span className="mt-0.5 shrink-0 text-comic-red">
              {conv.type === "group" ? (
                <Users className="h-5 w-5" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
            </span>
            <span className="flex-1 min-w-0">
              <span className="font-comic text-sm text-ink block truncate">{title}</span>
              {conv.last_message_preview && (
                <span className="text-xs text-ink-muted block truncate mt-0.5">
                  {conv.last_message_preview}
                </span>
              )}
              <span className="text-[10px] text-ink-muted mt-0.5 block">
                {new Date(conv.updated_at).toLocaleDateString()}
              </span>
            </span>
            {conv.type === "editor_review" && (
              <Badge variant="tag" className="text-[9px] shrink-0">
                Review
              </Badge>
            )}
          </>
        );

        return (
          <li key={conv.id}>
            {mode === "select" ? (
              <button type="button" className={rowClass} onClick={() => onSelect?.(conv.id)}>
                {inner}
              </button>
            ) : (
              <Link href={`/messages/${conv.id}`} className={rowClass}>
                {inner}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
