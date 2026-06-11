"use client";

import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useFriendStatus } from "@/hooks/useFriendStatus";
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
  const router = useRouter();
  const status = useFriendStatus(actorUsername, targetUsername);

  if (status !== "friends") return null;

  function handleClick() {
    const conv = findOrCreateDm(
      actorUsername,
      actorDisplayName,
      targetUsername,
      targetDisplayName
    );
    if (conv) router.push(`/messages/${conv.id}`);
  }

  return (
    <Button type="button" variant="comic-outline" size="sm" onClick={handleClick}>
      <MessageCircle className="h-3.5 w-3.5 mr-1" />
      Message
    </Button>
  );
}
