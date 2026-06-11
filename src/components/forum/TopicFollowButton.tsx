"use client";

import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useTopicFollow } from "@/hooks/useTopicFollow";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

interface TopicFollowButtonProps {
  forumId: string;
  className?: string;
}

export function TopicFollowButton({ forumId, className }: TopicFollowButtonProps) {
  const identity = useActingIdentity();
  const { following, toggle } = useTopicFollow(identity?.username ?? null, forumId);

  if (!identity?.username) return null;

  return (
    <Button
      type="button"
      variant={following ? "secondary" : "comic"}
      size="sm"
      className={className}
      onClick={toggle}
    >
      {following ? (
        <>
          <BellOff className="h-4 w-4 mr-1" />
          Unfollow
        </>
      ) : (
        <>
          <Bell className="h-4 w-4 mr-1" />
          Follow topic
        </>
      )}
    </Button>
  );
}
