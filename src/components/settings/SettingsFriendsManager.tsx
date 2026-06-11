"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFriendInbox } from "@/hooks/useFriendInbox";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
} from "@/lib/friend-requests-store";
import { removeMutualFriends } from "@/lib/friends-store";
import { findUserByUsername, searchUsers } from "@/lib/discover-users";
import { Button } from "@/components/ui/button";
import { Search, UserMinus, UserPlus } from "lucide-react";

export function SettingsFriendsManager() {
  const { actor, incoming, outgoing, friends } = useFriendInbox();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const friendUsernames = useMemo(
    () => new Set(friends.map((f) => f.username.toLowerCase())),
    [friends]
  );

  const pendingOutgoingUsernames = useMemo(
    () => new Set(outgoing.map((r) => r.to_username.toLowerCase())),
    [outgoing]
  );

  const pendingIncomingUsernames = useMemo(
    () => new Set(incoming.map((r) => r.from_username.toLowerCase())),
    [incoming]
  );

  if (!actor) return null;

  const searchResults = searchUsers(query.trim() || " ");
  const suggestions = searchResults.filter((u) => {
    const key = u.username.toLowerCase();
    if (key === actor.username) return false;
    if (friendUsernames.has(key)) return false;
    if (pendingOutgoingUsernames.has(key)) return false;
    if (pendingIncomingUsernames.has(key)) return false;
    return true;
  });

  function handleSendRequest(username: string, displayName: string) {
    if (!actor) return;
    setError(null);
    setSuccess(null);
    const result = sendFriendRequest(
      actor.username,
      actor.displayName,
      username,
      displayName
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(`Friend request sent to ${displayName} (@${username})`);
    setQuery("");
  }

  function handleSendByQuery() {
    if (!actor) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Search for a username or display name.");
      return;
    }
    const user = findUserByUsername(trimmed);
    if (!user) {
      setError(`No creator found for @${trimmed.replace(/^@/, "")}`);
      return;
    }
    if (user.username.toLowerCase() === actor.username) {
      setError("You cannot add yourself.");
      return;
    }
    handleSendRequest(user.username, user.display_name);
  }

  return (
    <div className="space-y-6">
      <p className="text-xs font-comic text-ink-muted comic-panel px-3 py-2">
        Acting as <span className="text-comic-red">@{actor.username}</span>
        {actor.isActingAsPersona ? " (demo persona)" : ""} — requests are sent and received
        for this profile only.
      </p>

      {incoming.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-comic text-sm text-ink">
            Requests for @{actor.username} ({incoming.length})
          </h3>
          <ul className="space-y-2">
            {incoming.map((req) => (
              <li
                key={req.id}
                className="comic-panel px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/profile/${req.from_username}`}
                    className="font-comic text-ink hover:text-comic-red"
                  >
                    {req.from_display_name}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    @{req.from_username} wants to be friends with @{req.to_username}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="comic"
                    size="sm"
                    type="button"
                    onClick={() => {
                      const ok = acceptFriendRequest(req.id, actor.username);
                      if (ok) {
                        setSuccess(`You are now friends with ${req.from_display_name}`);
                        setError(null);
                      } else {
                        setError("Could not accept request.");
                      }
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => rejectFriendRequest(req.id, actor.username)}
                  >
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="comic-panel p-4 space-y-3">
        <label className="font-comic text-sm text-ink">Find people</label>
        <p className="text-xs text-ink-muted">
          Search creators and send a friend request as @{actor.username}.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 border-2 border-ink px-3 py-2 bg-surface">
            <Search className="h-4 w-4 text-ink-muted shrink-0" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
                setSuccess(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSendByQuery();
                }
              }}
              placeholder="Search @username or name…"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>
        {error && <p className="text-xs text-comic-red">{error}</p>}
        {success && <p className="text-xs text-emerald-700 font-comic">{success}</p>}

        <ul className="space-y-1 max-h-56 overflow-auto">
          {suggestions.length === 0 ? (
            <li className="text-xs text-ink-muted italic px-1 py-2">
              No matching creators — try hollowscribe or roninforge.
            </li>
          ) : (
            suggestions.slice(0, 12).map((u) => (
              <li key={u.username}>
                <div className="flex items-center justify-between gap-2 px-2 py-2 hover:bg-comic-yellow/60">
                  <Link
                    href={`/profile/${u.username}`}
                    className="min-w-0 font-comic text-sm text-ink hover:text-comic-red"
                  >
                    {u.display_name}{" "}
                    <span className="text-ink-muted text-xs">@{u.username}</span>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => handleSendRequest(u.username, u.display_name)}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Become friends
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {outgoing.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-comic text-sm text-ink">
            Sent by @{actor.username} ({outgoing.length})
          </h3>
          <ul className="space-y-2">
            {outgoing.map((req) => (
              <li
                key={req.id}
                className="comic-panel px-4 py-3 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/profile/${req.to_username}`}
                    className="font-comic text-ink hover:text-comic-red"
                  >
                    {req.to_display_name}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    @{actor.username} → @{req.to_username} · Waiting for them
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => cancelFriendRequest(req.id, actor.username)}
                >
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="font-comic text-sm text-ink">
          Friends of @{actor.username} ({friends.length})
        </h3>
        <p className="text-xs text-ink-muted">
          Visible on{" "}
          <Link href={`/profile/${actor.username}`} className="text-comic-red hover:underline">
            /profile/{actor.username}
          </Link>
        </p>
        {friends.length === 0 ? (
          <p className="text-sm text-ink-muted italic">
            No friends yet — search above or visit a profile and click Become friends.
          </p>
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => (
              <li
                key={f.username}
                className="comic-panel px-4 py-3 flex items-center justify-between gap-2"
              >
                <Link
                  href={`/profile/${f.username}`}
                  className="font-comic text-ink hover:text-comic-red min-w-0"
                >
                  {f.display_name}
                  <span className="text-xs text-ink-muted block">@{f.username}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => removeMutualFriends(actor.username, f.username)}
                  title="Remove friend"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
