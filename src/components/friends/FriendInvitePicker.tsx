"use client";

import { useMemo, useState } from "react";
import type { FriendLink } from "@/types/database";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

const PREVIEW_LIMIT = 5;

interface FriendInvitePickerProps {
  friends: FriendLink[];
  selected: string[];
  onChange: (usernames: string[]) => void;
  className?: string;
}

function sortFriends(friends: FriendLink[]): FriendLink[] {
  return [...friends].sort((a, b) =>
    a.display_name.localeCompare(b.display_name, undefined, { sensitivity: "base" })
  );
}

function FriendChip({
  friend,
  active,
  onClick,
}: {
  friend: FriendLink;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "font-comic text-xs px-3 py-1 border-2 border-ink",
        active ? "bg-comic-red text-white" : "bg-surface hover:bg-comic-yellow/50"
      )}
    >
      {friend.display_name}
    </button>
  );
}

export function FriendInvitePicker({
  friends,
  selected,
  onChange,
  className,
}: FriendInvitePickerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQuery, setModalQuery] = useState("");

  const sortedFriends = useMemo(() => sortFriends(friends), [friends]);
  const previewFriends = sortedFriends.slice(0, PREVIEW_LIMIT);
  const hasMore = sortedFriends.length > PREVIEW_LIMIT;

  const modalFriends = useMemo(() => {
    const q = modalQuery.trim().toLowerCase();
    if (!q) return sortedFriends;
    return sortedFriends.filter(
      (f) =>
        f.display_name.toLowerCase().includes(q) ||
        f.username.toLowerCase().includes(q)
    );
  }, [sortedFriends, modalQuery]);

  function toggle(username: string) {
    onChange(
      selected.includes(username)
        ? selected.filter((u) => u !== username)
        : [...selected, username]
    );
  }

  function closeModal() {
    setModalOpen(false);
    setModalQuery("");
  }

  if (friends.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <label className="font-comic text-sm block">Invite friends</label>
        <p className="text-xs text-ink-muted comic-panel px-3 py-2">
          You have no friends yet. Add friends from Settings or a profile before inviting
          anyone to an RPG topic.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="font-comic text-sm block">Invite friends</label>
      <p className="text-xs text-ink-muted">
        Only people on your friends list can be invited.
      </p>

      <div className="flex flex-wrap gap-2">
        {previewFriends.map((friend) => (
          <FriendChip
            key={friend.username}
            friend={friend}
            active={selected.includes(friend.username)}
            onClick={() => toggle(friend.username)}
          />
        ))}
        {hasMore && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="font-comic text-xs px-3 py-1 border-2 border-ink bg-comic-yellow hover:bg-comic-red hover:text-white"
          >
            Show more ({sortedFriends.length - PREVIEW_LIMIT})
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-ink-muted">
          {selected.length} friend{selected.length === 1 ? "" : "s"} invited
        </p>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="friend-picker-title"
          onClick={closeModal}
        >
          <div
            className="comic-panel w-full max-w-md bg-surface border-2 border-ink shadow-[4px_4px_0_#1a1a2e] flex flex-col max-h-[min(32rem,85vh)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 p-4 border-b-2 border-ink">
              <h2 id="friend-picker-title" className="font-comic text-lg text-ink">
                Choose friends
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 border-2 border-ink hover:bg-comic-yellow"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 border-b-2 border-ink">
              <div className="flex items-center gap-2 border-2 border-ink px-3 py-2 bg-surface">
                <Search className="h-4 w-4 text-ink-muted shrink-0" />
                <input
                  type="search"
                  value={modalQuery}
                  onChange={(e) => setModalQuery(e.target.value)}
                  placeholder="Search friends…"
                  className="flex-1 bg-transparent text-sm outline-none"
                  autoFocus
                />
              </div>
            </div>

            <ul className="overflow-y-auto flex-1 p-2 space-y-1">
              {modalFriends.length === 0 ? (
                <li className="text-sm text-ink-muted text-center py-6 font-comic">
                  No friends match your search.
                </li>
              ) : (
                modalFriends.map((friend) => {
                  const active = selected.includes(friend.username);
                  return (
                    <li key={friend.username}>
                      <button
                        type="button"
                        onClick={() => toggle(friend.username)}
                        className={cn(
                          "w-full text-left px-3 py-2 border-2 border-ink font-comic text-sm flex items-center justify-between gap-2",
                          active
                            ? "bg-comic-red text-white"
                            : "bg-surface hover:bg-comic-yellow/50"
                        )}
                      >
                        <span>{friend.display_name}</span>
                        <span className="text-xs opacity-80">@{friend.username}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            <div className="p-4 border-t-2 border-ink">
              <button
                type="button"
                onClick={closeModal}
                className="w-full font-comic text-sm px-4 py-2 border-2 border-ink bg-comic-yellow hover:bg-comic-red hover:text-white"
              >
                Done ({selected.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
