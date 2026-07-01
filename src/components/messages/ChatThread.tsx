"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, MessageSquare, UserMinus } from "lucide-react";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useFriendActor } from "@/hooks/useFriendActor";
import { ReportDialog } from "@/components/reports/ReportDialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { Badge } from "@/components/ui/badge";
import {
  conversationTitleForUser,
  getConversation,
  leaveConversation,
  removeGroupMember,
  sendMessage,
  subscribeMessages,
} from "@/lib/messages-store";
import type { Conversation } from "@/types/database";

interface ChatThreadProps {
  conversationId: string;
  embedded?: boolean;
  onLeave?: () => void;
}

export function ChatThread({ conversationId, embedded = false, onLeave }: ChatThreadProps) {
  const router = useRouter();
  const actor = useFriendActor();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useChatMessages(
    conversationId,
    actor?.username ?? null
  );

  useEffect(() => {
    const refresh = () => setConversation(getConversation(conversationId) ?? null);
    refresh();
    return subscribeMessages(refresh);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!actor) {
    return (
      <p className="comic-panel p-8 text-center text-ink-muted font-comic">Sign in to view messages.</p>
    );
  }

  if (!conversation) {
    return (
      <p className="comic-panel p-8 text-center text-ink-muted font-comic">Conversation not found.</p>
    );
  }

  const title = conversationTitleForUser(conversation, actor.username);
  const isOwner = conversation.participants.some(
    (p) => p.username === actor.username && p.role === "owner"
  );
  const isGroup = conversation.type === "group";
  const otherMembers = conversation.participants.filter(
    (p) => p.username !== actor.username
  );

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;
    const msg = sendMessage(conversationId, actor.username, actor.displayName, draft);
    if (msg) setDraft("");
  }

  function handleLeave() {
    if (!actor) return;
    if (!confirm("Leave this conversation?")) return;
    leaveConversation(conversationId, actor.username);
    if (onLeave) {
      onLeave();
      return;
    }
    router.push("/messages");
  }

  function handleRemove(username: string) {
    if (!actor) return;
    if (!confirm(`Remove @${username} from the group?`)) return;
    removeGroupMember(conversationId, actor.username, username);
  }

  return (
    <div
      className={
        embedded
          ? "flex flex-col flex-1 min-h-0 overflow-hidden"
          : "comic-card overflow-hidden flex flex-col min-h-[28rem]"
      }
    >
      <div
        className={
          embedded
            ? "px-3 py-2 border-b-2 border-dashed border-ink flex flex-wrap items-center justify-between gap-2 shrink-0"
            : "comic-panel-header px-4 py-3 flex flex-wrap items-center justify-between gap-2"
        }
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <MessageSquare className="h-5 w-5 shrink-0" />
            <h1 className="font-comic text-lg truncate">{title}</h1>
            {conversation.type === "editor_review" && (
              <Badge variant="comic" className="text-[10px]">
                Editor review
              </Badge>
            )}
          </div>
          {conversation.post_id && (
            <Link
              href={`/post/${conversation.post_id}`}
              className="text-xs text-comic-red hover:underline mt-0.5 inline-block"
            >
              View post →
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {isGroup && (
            <Button type="button" variant="ghost" size="sm" onClick={handleLeave}>
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Leave
            </Button>
          )}
        </div>
      </div>

      {isGroup && (
        <div className="px-4 py-2 border-b-2 border-dashed border-ink bg-surface text-xs">
          <span className="font-comic text-ink-muted">Members: </span>
          {conversation.participants.map((p) => (
            <span key={p.username} className="inline-flex items-center gap-1 mr-2">
              <Link href={`/profile/${p.username}`} className="text-comic-red hover:underline">
                @{p.username}
              </Link>
              {isOwner && p.username !== actor.username && p.role !== "owner" && (
                <button
                  type="button"
                  onClick={() => handleRemove(p.username)}
                  className="text-ink-muted hover:text-comic-red"
                  title={`Remove ${p.display_name}`}
                >
                  <UserMinus className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <div
        className={
          embedded
            ? "flex-1 overflow-y-auto p-3 space-y-3 bg-surface min-h-0"
            : "flex-1 overflow-y-auto p-4 space-y-3 bg-surface min-h-[16rem] max-h-[32rem]"
        }
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-ink-muted italic py-8">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg) => {
            const mine = msg.author_username === actor.username;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
              >
                {!mine && (
                  <Link href={`/profile/${msg.author_username}`} className="shrink-0 mb-1">
                    <UserAvatar
                      username={msg.author_username}
                      displayName={msg.author_display_name}
                      size="xs"
                    />
                  </Link>
                )}
                <div
                  className={`max-w-[85%] border-2 border-ink px-3 py-2 ${
                    mine ? "bg-comic-yellow" : "bg-white"
                  }`}
                >
                  {!mine && (
                    <p className="text-[10px] font-comic text-comic-red mb-0.5">
                      {msg.author_display_name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                  <p className="text-[10px] text-ink-muted mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="border-t-4 border-ink p-3 flex gap-2 bg-comic-yellow/30"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border-2 border-ink bg-surface px-3 py-2 text-sm min-w-0"
        />
        <Button type="submit" variant="comic" size="sm" disabled={!draft.trim()}>
          Send
        </Button>
      </form>

      {otherMembers.length > 0 && (
        <div className="px-4 py-2 border-t-2 border-dashed border-ink flex flex-wrap gap-2">
          {otherMembers.map((p) => (
            <ReportDialog
              key={p.username}
              targetType="user"
              reporterUsername={actor.username}
              reporterDisplayName={actor.displayName}
              targetUsername={p.username}
              targetDisplayName={p.display_name}
              conversationId={conversationId}
              label={`Report @${p.username}`}
              className="text-xs"
            />
          ))}
        </div>
      )}
    </div>
  );
}
