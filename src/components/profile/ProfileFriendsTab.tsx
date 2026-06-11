"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { useFriends } from "@/hooks/useFriends";
import { useProfilePrivacy } from "@/hooks/useProfilePrivacy";
import { Users } from "lucide-react";

interface ProfileFriendsTabProps {
  username: string;
  isOwnAccountProfile: boolean;
  isOwnProfile: boolean;
}

export function ProfileFriendsTab({
  username,
  isOwnAccountProfile,
  isOwnProfile,
}: ProfileFriendsTabProps) {
  const friends = useFriends(username);
  const { ready, showFriendsList } = useProfilePrivacy(username);
  const isOwner = isOwnProfile || isOwnAccountProfile;

  if (!isOwner) {
    if (!ready) return null;
    if (!showFriendsList) {
      return (
        <div className="comic-panel p-8 text-center space-y-3">
          <Users className="h-10 w-10 mx-auto text-ink-muted opacity-50" />
          <p className="font-comic text-ink-muted">This creator keeps their friends list private.</p>
        </div>
      );
    }
  }

  if (friends.length === 0) {
    return (
      <div className="comic-panel p-8 text-center space-y-3">
        <Users className="h-10 w-10 mx-auto text-ink-muted opacity-50" />
        <p className="font-comic text-ink-muted">
          {isOwner
            ? "No friends yet — accept requests in Settings."
            : "No friends listed yet."}
        </p>
        {isOwner && (
          <Link href="/settings?tab=friends" className="text-sm text-comic-red font-comic hover:underline">
            Add friends in Settings →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {friends.map((friend) => (
        <Link
          key={friend.username}
          href={`/profile/${friend.username}`}
          className="comic-card p-4 flex items-center gap-3 hover:no-underline group"
        >
          <UserAvatar
            username={friend.username}
            displayName={friend.display_name}
            size="md"
          />
          <div className="min-w-0">
            <p className="font-comic text-ink group-hover:text-comic-red truncate">
              {friend.display_name}
            </p>
            <p className="text-xs text-ink-muted truncate">@{friend.username}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
