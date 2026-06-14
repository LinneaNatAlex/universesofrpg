"use client";

import { ProfileCreationsTab } from "@/components/profile/ProfileCreationsTab";
import type { FeedPost } from "@/types/database";

interface ProfileCharacterCreationsTabProps {
  characters: FeedPost[];
  showPendingNote?: boolean;
  editable?: boolean;
}

export function ProfileCharacterCreationsTab({
  characters,
  showPendingNote = false,
  editable = false,
}: ProfileCharacterCreationsTabProps) {
  if (characters.length === 0) {
    return (
      <div className="comic-panel p-8 text-center space-y-2">
        <p className="font-comic text-ink">No character creations yet.</p>
        <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
          Build characters in Create and check &quot;Save to Character Creations only&quot; —
          then use them in RPG topics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-comic text-ink-muted comic-panel px-3 py-2">
        Personal characters for stories and topics — visible on your profile, not on the public
        feed.
      </p>
      <ProfileCreationsTab
        creations={characters}
        showPendingNote={showPendingNote}
        editable={editable}
      />
    </div>
  );
}
