"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFriendActor } from "@/hooks/useFriendActor";
import { useFriends } from "@/hooks/useFriends";
import { createGroupChat } from "@/lib/messages-store";
import { Button } from "@/components/ui/button";

export function NewGroupChatForm() {
  const router = useRouter();
  const actor = useFriendActor();
  const friends = useFriends(actor?.username ?? "");
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  if (!actor) return null;

  function toggleFriend(username: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;
    setError(null);
    const members = friends
      .filter((f) => selected.has(f.username))
      .map((f) => ({ username: f.username, display_name: f.display_name }));

    const conv = createGroupChat(actor.username, actor.displayName, title, members);
    if (!conv) {
      setError("Add a title and at least one friend.");
      return;
    }
    router.push(`/messages/${conv.id}`);
  }

  return (
    <form onSubmit={handleCreate} className="comic-panel p-5 space-y-4 max-w-lg">
      <h2 className="font-comic text-xl text-ink">New group chat</h2>
      <p className="text-sm text-ink-muted">
        Invite friends to a private group. You can remove members or leave later.
      </p>

      <div>
        <label className="block font-comic text-sm mb-1">Group name</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Campaign planning, critique circle…"
          className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
        />
      </div>

      <div>
        <p className="font-comic text-sm mb-2">Add friends</p>
        {friends.length === 0 ? (
          <p className="text-sm text-ink-muted italic">Add friends first in Settings.</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto border-2 border-dashed border-ink p-2">
            {friends.map((f) => (
              <li key={f.username}>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(f.username)}
                    onChange={() => toggleFriend(f.username)}
                  />
                  <span className="font-comic">{f.display_name}</span>
                  <span className="text-ink-muted text-xs">@{f.username}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm font-comic text-comic-red">{error}</p>}

      <Button type="submit" variant="comic" size="sm">
        Create group
      </Button>
    </form>
  );
}
