"use client";

import { useEffect, useState } from "react";
import {
  getConversationsForUser,
  getUnreadCount,
  subscribeMessages,
} from "@/lib/messages-store";
import type { Conversation } from "@/types/database";

export function useConversations(username: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unread, setUnread] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!username) {
      setConversations([]);
      setUnread(0);
      setReady(true);
      return;
    }

    const refresh = () => {
      setConversations(getConversationsForUser(username));
      setUnread(getUnreadCount(username));
      setReady(true);
    };
    refresh();
    return subscribeMessages(refresh);
  }, [username]);

  return { conversations, unread, ready };
}
