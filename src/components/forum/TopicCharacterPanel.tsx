"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getUserTopicCharacter, upsertTopicCharacter } from "@/lib/forums-store";
import type { RpgForum } from "@/types/database";
import { UserCircle2 } from "lucide-react";

interface TopicCharacterPanelProps {
  forum: RpgForum;
  username: string;
}

export function TopicCharacterPanel({ forum, username }: TopicCharacterPanelProps) {
  const existing = getUserTopicCharacter(forum, username);
  const [name, setName] = useState(existing?.name ?? "");
  const [age, setAge] = useState(existing?.age ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    setSaved(false);
    if (!name.trim()) {
      setError("Give your character a name.");
      return;
    }
    const result = upsertTopicCharacter(forum.id, username, {
      name: name.trim(),
      age: age.trim() || null,
    });
    if (!result) {
      setError("Could not save your character.");
      return;
    }
    setSaved(true);
  }

  const roster = forum.characters ?? [];

  return (
    <div className="comic-panel p-4 space-y-4">
      <div className="flex items-start gap-2">
        <UserCircle2 className="h-5 w-5 text-comic-red shrink-0 mt-0.5" aria-hidden />
        <div>
          <h2 className="font-comic text-base text-ink">Your character in this story</h2>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Register who you play in this topic. Every reply you write will appear as this
            character automatically.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-comic text-ink mb-1">Character name</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
            placeholder="Lyra Nightshade"
          />
        </div>
        <div>
          <label className="block text-xs font-comic text-ink mb-1">
            Age <span className="text-ink-muted font-normal">(optional)</span>
          </label>
          <input
            value={age}
            onChange={(e) => {
              setAge(e.target.value);
              setSaved(false);
            }}
            className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
            placeholder="27, teen, ancient…"
          />
        </div>
      </div>

      {error && <p className="text-xs text-comic-red">{error}</p>}
      {saved && (
        <p className="text-xs font-comic text-ink">
          Saved — your replies will post as <strong>{name.trim()}</strong>.
        </p>
      )}

      <Button variant="secondary" size="sm" onClick={handleSave}>
        {existing ? "Update my character" : "Add my character"}
      </Button>

      {roster.length > 0 && (
        <div className="border-t-2 border-dashed border-ink pt-3 space-y-2">
          <p className="text-[11px] font-comic uppercase tracking-wide text-ink-muted">
            Cast in this topic
          </p>
          <ul className="space-y-1.5">
            {roster.map((character) => (
              <li
                key={character.id}
                className="text-sm flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
              >
                <span className="font-comic text-ink">{character.name}</span>
                {character.age && (
                  <span className="text-xs text-ink-muted">age {character.age}</span>
                )}
                <span className="text-xs text-ink-muted">
                  — @{character.owner_username}
                  {character.linked_post_id && (
                    <>
                      {" · "}
                      <Link
                        href={`/post/${character.linked_post_id}`}
                        className="text-comic-red hover:underline"
                      >
                        character sheet
                      </Link>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
