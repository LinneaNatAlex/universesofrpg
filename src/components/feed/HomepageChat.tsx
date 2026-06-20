"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, Trash2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useHomepageChat } from "@/hooks/useHomepageChat";
import { parseChatNameColorFromMetadata } from "@/lib/chat-name-color-device";
import {
  DEFAULT_CHAT_NAME_COLOR,
  resolveChatNameColor,
  toColorInputValue,
} from "@/lib/homepage-chat-colors";
import { MAX_HOMEPAGE_CHAT_BODY } from "@/lib/homepage-chat-platform-sanitize";
import {
  deleteHomepageChatMessage,
  restoreHomepageChatNameColorFromAccount,
  sendHomepageChatMessage,
  setHomepageChatNameColor,
} from "@/lib/homepage-chat-store";
import { cn } from "@/lib/utils";

function formatChatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HomepageChat({ className }: { className?: string }) {
  const { user, isLoggedIn, loading } = useAuth();
  const identity = useActingIdentity();
  const { isAdmin } = useAdmin();
  const { messages, nameColors, live } = useHomepageChat({ poll: true });
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [myColor, setMyColor] = useState(DEFAULT_CHAT_NAME_COLOR);
  const [colorsReady, setColorsReady] = useState(false);
  const restoredAccountColorRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    setColorsReady(true);
    if (identity?.username) {
      setMyColor(resolveChatNameColor(identity.username, nameColors));
    }
  }, [identity?.username, nameColors]);

  useEffect(() => {
    if (!identity?.username || !user || restoredAccountColorRef.current) return;
    const fromAccount = parseChatNameColorFromMetadata(
      user.user_metadata as Record<string, unknown> | undefined
    );
    if (fromAccount) {
      restoreHomepageChatNameColorFromAccount(identity.username, fromAccount);
    }
    restoredAccountColorRef.current = true;
  }, [identity?.username, user]);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 48;
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!identity?.username) {
      setError("Sign in to chat.");
      return;
    }

    const sent = sendHomepageChatMessage({
      author_username: identity.username,
      author_display_name: identity.displayName,
      body: draft,
      author_is_admin: isAdmin,
    });

    if (!sent) {
      setError("Could not send — keep messages under 2,000 characters.");
      return;
    }

    setDraft("");
    stickToBottomRef.current = true;
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this message from the realm chat?")) return;
    deleteHomepageChatMessage(id);
  }

  function handleColorPick(color: string) {
    if (!identity?.username) return;
    if (setHomepageChatNameColor(identity.username, color)) {
      setMyColor(color);
    }
  }

  return (
    <section className={cn("comic-card overflow-hidden flex flex-col h-full", className)}>
      <div className="comic-panel-header px-3 py-2 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <MessageCircle className="h-4 w-4 shrink-0" />
          <h2 className="font-comic text-sm leading-none">Realm chat</h2>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[9px] font-comic uppercase shrink-0 ${
            live ? "text-white/90" : "text-white/60"
          }`}
          title={live ? "Connected to live chat" : "Syncing…"}
        >
          <Wifi className={`h-2.5 w-2.5 ${live ? "" : "opacity-50"}`} />
          Live
        </span>
      </div>

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2.5 space-y-1.5 bg-surface min-h-0 font-body normal-case"
      >
        {messages.length === 0 ? (
          <p className="text-center text-xs text-ink-muted italic py-3 px-1 leading-relaxed">
            No messages yet — say hello!
          </p>
        ) : (
          messages.map((msg) => {
            const mine =
              !!identity?.username &&
              msg.author_username.toLowerCase() === identity.username.toLowerCase();
            const nameColor = colorsReady
              ? resolveChatNameColor(msg.author_username, nameColors)
              : DEFAULT_CHAT_NAME_COLOR;

            const showAdmin = msg.author_is_admin === true || (mine && isAdmin);

            return (
              <div
                key={msg.id}
                className="group relative text-xs leading-relaxed break-words"
                title={formatChatTime(msg.created_at)}
              >
                {mine ? (
                  <span style={{ color: nameColor }}>You</span>
                ) : (
                  <Link
                    href={`/profile/${msg.author_username}`}
                    className="hover:underline font-medium"
                    style={{ color: nameColor }}
                  >
                    {msg.author_display_name}
                  </Link>
                )}
                {showAdmin && (
                  <span className="italic text-ink-muted"> (Admin)</span>
                )}
                <span className="text-ink-muted">: </span>
                <span className="text-ink normal-case">{msg.body}</span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(msg.id)}
                    className="ml-1.5 inline-flex align-middle text-comic-red opacity-0 group-hover:opacity-100 focus:opacity-100 hover:underline"
                    title="Remove message (admin)"
                    aria-label="Remove message"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t-4 border-ink bg-comic-yellow/30 px-3 py-2 shrink-0">
        {loading ? (
          <p className="text-xs text-ink-muted text-center font-body normal-case">Loading…</p>
        ) : !isLoggedIn ? (
          <div className="text-center space-y-1 py-0.5 font-body normal-case text-xs">
            <p className="text-ink-muted">Log in to join the realm chat.</p>
            <div className="flex justify-center gap-2">
              <Link href="/login" className="text-comic-red hover:underline">
                Sign in
              </Link>
              <span className="text-ink-muted">·</span>
              <Link href="/signup" className="text-comic-red hover:underline">
                Join free
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-1.5 font-body normal-case">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-ink-muted shrink-0">Your name color</span>
              <input
                type="color"
                value={toColorInputValue(myColor)}
                onChange={(e) => handleColorPick(e.target.value)}
                title="Pick your chat name color"
                aria-label="Pick your chat name color"
                className="h-7 w-9 shrink-0 cursor-pointer border-2 border-ink bg-surface p-0.5 shadow-[2px_2px_0_#1a1a2e]"
              />
              <span
                className="text-[10px] font-medium truncate max-w-[6rem]"
                style={{ color: myColor }}
              >
                {identity?.displayName}
              </span>
            </div>
            {identity?.isActingAsPersona && (
              <p className="text-[11px] text-comic-red leading-none">
                As @{identity.username}
              </p>
            )}
            <div className="flex gap-1.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_HOMEPAGE_CHAT_BODY))}
                placeholder="Say something…"
                maxLength={MAX_HOMEPAGE_CHAT_BODY}
                className="flex-1 border-2 border-ink bg-surface px-2.5 py-1.5 text-xs min-w-0 font-body normal-case"
              />
              <Button
                type="submit"
                variant="comic"
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                disabled={!draft.trim()}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            {error && <p className="text-xs text-comic-red">{error}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
