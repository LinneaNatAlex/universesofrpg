"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CONTENT_SYNCED_EVENT,
  fetchHomepageChatPlatformState,
  mergeHomepageChatState,
} from "@/lib/content-sync";
import {
  applyHomepageChatPersistState,
  buildHomepageChatPersistState,
  getHomepageChatMessages,
  getHomepageChatNameColors,
  subscribeHomepageChat,
} from "@/lib/homepage-chat-store";
import type { HomepageChatMessage } from "@/types/database";

const POLL_MS = 5_000;
const VISIBLE_MESSAGE_LIMIT = 80;

export function useHomepageChat(options?: { poll?: boolean }) {
  const shouldPoll = options?.poll ?? true;
  const [messages, setMessages] = useState<HomepageChatMessage[]>([]);
  const [nameColors, setNameColors] = useState<Record<string, string>>({});
  const [live, setLive] = useState(false);

  const refresh = useCallback(() => {
    const all = getHomepageChatMessages();
    setMessages(all.slice(-VISIBLE_MESSAGE_LIMIT));
    setNameColors(getHomepageChatNameColors());
  }, []);

  const pullRemote = useCallback(async () => {
    const remote = await fetchHomepageChatPlatformState();
    if (!remote) return;
    const local = buildHomepageChatPersistState();
    applyHomepageChatPersistState(mergeHomepageChatState(local, remote));
    setLive(true);
  }, []);

  useEffect(() => {
    refresh();
    return subscribeHomepageChat(refresh);
  }, [refresh]);

  useEffect(() => {
    const onSynced = () => refresh();
    window.addEventListener(CONTENT_SYNCED_EVENT, onSynced);
    return () => window.removeEventListener(CONTENT_SYNCED_EVENT, onSynced);
  }, [refresh]);

  useEffect(() => {
    if (!shouldPoll) return;

    let cancelled = false;

    void pullRemote();

    const timer = setInterval(() => {
      if (cancelled || document.visibilityState !== "visible") return;
      void pullRemote();
    }, POLL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") void pullRemote();
    }

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [shouldPoll, pullRemote]);

  return { messages, nameColors, live, refresh, pullRemote };
}
