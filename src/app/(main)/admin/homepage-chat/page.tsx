"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  clearAllHomepageChatMessages,
  deleteHomepageChatMessage,
  getHomepageChatMessages,
  subscribeHomepageChat,
} from "@/lib/homepage-chat-store";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { HomepageChatMessage } from "@/types/database";

export default function AdminHomepageChatPage() {
  const [messages, setMessages] = useState<HomepageChatMessage[]>([]);

  useEffect(() => {
    const refresh = () => setMessages(getHomepageChatMessages());
    refresh();
    return subscribeHomepageChat(refresh);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-comic text-xl text-ink">
          Chat ({messages.length} messages)
        </h2>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-comic-red font-comic"
            onClick={() => {
              if (
                confirm(
                  `Clear all ${messages.length} messages from the live homepage chat? This syncs to the server.`
                )
              ) {
                clearAllHomepageChatMessages();
              }
            }}
          >
            Clear all
          </Button>
        )}
      </div>

      <p className="text-sm text-ink-muted">
        Moderate the public live chat on the{" "}
        <Link href="/" className="text-comic-red hover:underline font-comic">
          home page
        </Link>
        . Deleted messages are tombstoned so they stay removed after sync.
      </p>

      {messages.length === 0 ? (
        <p className="text-ink-muted text-sm italic comic-panel p-6 text-center">No chat messages.</p>
      ) : (
        <div className="space-y-2">
          {[...messages].reverse().map((msg) => (
            <div key={msg.id} className="comic-panel p-4">
              <div className="flex justify-between gap-3 items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <Link
                      href={`/profile/${msg.author_username}`}
                      className="font-comic text-comic-red hover:underline"
                    >
                      {msg.author_display_name}
                    </Link>
                    <span className="text-ink-muted text-xs ml-2">
                      @{msg.author_username} · {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-sm mt-2 text-ink whitespace-pre-wrap break-words">{msg.body}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-comic-red shrink-0"
                  onClick={() => {
                    if (confirm("Delete this chat message?")) deleteHomepageChatMessage(msg.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
