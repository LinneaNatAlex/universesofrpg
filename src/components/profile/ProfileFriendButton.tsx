"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFriendStatus } from "@/hooks/useFriendStatus";
import { useCreatorProfileActions } from "@/hooks/useCreatorProfileActions";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  rejectFriendRequest,
  sendFriendRequest,
} from "@/lib/friend-requests-store";
import { removeMutualFriends } from "@/lib/friends-store";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Clock } from "lucide-react";

interface ProfileFriendButtonProps {
  actorUsername: string;
  actorDisplayName: string;
  targetUsername: string;
  targetDisplayName: string;
}

export function ProfileFriendButton({
  actorUsername,
  actorDisplayName,
  targetUsername,
  targetDisplayName,
}: ProfileFriendButtonProps) {
  const { isLoggedIn, loading } = useAuth();
  const [message, setMessage] = useState<string | null>(null);

  const actorKey = actorUsername.toLowerCase();
  const targetKey = targetUsername.toLowerCase();
  const status = useFriendStatus(actorKey, targetKey);
  const { ready, acceptFriendRequests } = useCreatorProfileActions(targetUsername);

  if (actorKey === targetKey) return null;
  if (!ready || loading) return null;

  if (!isLoggedIn) {
    return (
      <Link href="/login" className="text-xs font-comic text-comic-red hover:underline">
        Sign in to become friends
      </Link>
    );
  }

  function handleSendRequest() {
    setMessage(null);
    const result = sendFriendRequest(
      actorKey,
      actorDisplayName,
      targetKey,
      targetDisplayName
    );
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage("Friend request sent");
  }

  function handleCancelRequest() {
    const outgoing = getOutgoingFriendRequests(actorKey).find(
      (r) => r.to_username.toLowerCase() === targetKey
    );
    if (outgoing) cancelFriendRequest(outgoing.id, actorKey);
    setMessage(null);
  }

  function handleAccept() {
    const req = getIncomingFriendRequests(actorKey).find(
      (r) => r.from_username.toLowerCase() === targetKey
    );
    if (!req) {
      setMessage("Request not found — check Settings → Friends.");
      return;
    }
    const ok = acceptFriendRequest(req.id, actorKey);
    setMessage(ok ? "You are now friends" : "Could not accept — try Settings → Friends.");
  }

  function handleDecline() {
    const req = getIncomingFriendRequests(actorKey).find(
      (r) => r.from_username.toLowerCase() === targetKey
    );
    if (req) rejectFriendRequest(req.id, actorKey);
    setMessage(null);
  }

  function handleUnfriend() {
    removeMutualFriends(actorKey, targetKey);
    setMessage(null);
  }

  let button: React.ReactNode;

  switch (status) {
    case "friends":
      button = (
        <Button type="button" variant="ghost" size="sm" onClick={handleUnfriend}>
          <UserMinus className="h-4 w-4 mr-1" /> Friends
        </Button>
      );
      break;
    case "pending_outgoing":
      button = (
        <Button type="button" variant="ghost" size="sm" onClick={handleCancelRequest}>
          <Clock className="h-4 w-4 mr-1" /> Request sent
        </Button>
      );
      break;
    case "pending_incoming":
      button = (
        <div className="flex gap-2">
          <Button type="button" variant="comic" size="sm" onClick={handleAccept}>
            Accept
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleDecline}>
            Decline
          </Button>
        </div>
      );
      break;
    default:
      if (!acceptFriendRequests) {
        return null;
      }
      button = (
        <Button type="button" variant="secondary" size="sm" onClick={handleSendRequest}>
          <UserPlus className="h-4 w-4 mr-1" /> Become friends
        </Button>
      );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {button}
      {message && (
        <p className="text-[10px] font-comic text-ink-muted max-w-[220px] text-right">{message}</p>
      )}
    </div>
  );
}
