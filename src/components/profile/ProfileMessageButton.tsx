"use client";

import { MessageCircle } from "lucide-react";
import { usePrivateMessages } from "@/contexts/PrivateMessagesContext";
import { findOrCreateDm } from "@/lib/messages-store";
import { Button } from "@/components/ui/button";

interface ProfileMessageButtonProps {
  actorUsername: string;
  actorDisplayName: string;
  targetUsername: string;
  targetDisplayName: string;
}

export function ProfileMessageButton({
  actorUsername,
  actorDisplayName,
  targetUsername,
  targetDisplayName,
}: ProfileMessageButtonProps) {
  const { openConversation } = usePrivateMessages();

  function handleClick() {
    const conv = findOrCreateDm(
      actorUsername,
      actorDisplayName,
      targetUsername,
      targetDisplayName,
    );
    if (conv) openConversation(conv.id);
  }

  return (
    <Button type="button" variant="comic-outline" size="sm" onClick={handleClick}>
      <MessageCircle className="h-3.5 w-3.5 mr-1" />
      Snakk privat
    </Button>
  );
}
