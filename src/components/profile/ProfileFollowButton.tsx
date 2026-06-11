"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useCreatorFollow } from "@/hooks/useCreatorFollow";
import { useCreatorProfileActions } from "@/hooks/useCreatorProfileActions";
import { Button } from "@/components/ui/button";
import { UserCheck, UserMinus } from "lucide-react";

interface ProfileFollowButtonProps {
  actorUsername: string;
  targetUsername: string;
  targetDisplayName: string;
}

export function ProfileFollowButton({
  actorUsername,
  targetUsername,
  targetDisplayName,
}: ProfileFollowButtonProps) {
  const { isLoggedIn, loading } = useAuth();
  const { ready, showFollowButton } = useCreatorProfileActions(targetUsername);
  const { following, toggle } = useCreatorFollow(
    actorUsername,
    targetUsername,
    targetDisplayName
  );

  if (actorUsername.toLowerCase() === targetUsername.toLowerCase()) return null;
  if (!ready || loading) return null;
  if (!showFollowButton) return null;

  if (!isLoggedIn) {
    return (
      <Link href="/login" className="text-xs font-comic text-comic-red hover:underline">
        Sign in to follow
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant={following ? "ghost" : "comic"}
      size="sm"
      onClick={toggle}
    >
      {following ? (
        <>
          <UserMinus className="h-4 w-4 mr-1" />
          Following
        </>
      ) : (
        <>
          <UserCheck className="h-4 w-4 mr-1" />
          Follow
        </>
      )}
    </Button>
  );
}
