"use client";

import { useEffect, useState } from "react";
import {
  getMessages,
  markConversationRead,
  subscribeMessages,
} from "@/lib/messages-store";
import type { ChatMessage } from "@/types/database";

export function useChatMessages(conversationId: string | null, viewerUsername: string | null) {
  const [items, setItems] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!conversationId || !viewerUsername) {
      setItems([]);
      return;
    }

    const refresh = () => {
      setItems(getMessages(conversationId));
      markConversationRead(conversationId, viewerUsername);
    };
    refresh();
    return subscribeMessages(refresh);
  }, [conversationId, viewerUsername]);

  return items;
}
