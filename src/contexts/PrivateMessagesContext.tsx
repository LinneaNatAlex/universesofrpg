"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface PrivateMessagesContextValue {
  isOpen: boolean;
  activeConversationId: string | null;
  openInbox: () => void;
  openConversation: (conversationId: string | null) => void;
  close: () => void;
}

const PrivateMessagesContext = createContext<PrivateMessagesContextValue | null>(
  null,
);

export function PrivateMessagesProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );

  const openInbox = useCallback(() => {
    setIsOpen(true);
    setActiveConversationId(null);
  }, []);

  const openConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId?.trim() ? conversationId : null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      activeConversationId,
      openInbox,
      openConversation,
      close,
    }),
    [isOpen, activeConversationId, openInbox, openConversation, close],
  );

  return (
    <PrivateMessagesContext.Provider value={value}>
      {children}
    </PrivateMessagesContext.Provider>
  );
}

export function usePrivateMessages() {
  const ctx = useContext(PrivateMessagesContext);
  if (!ctx) {
    throw new Error("usePrivateMessages must be used within PrivateMessagesProvider");
  }
  return ctx;
}
