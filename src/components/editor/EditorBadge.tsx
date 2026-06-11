import { getEditorLevelMeta } from "@/lib/editor-constants";
import type { EditorLevel } from "@/types/database";

interface EditorBadgeProps {
  level: EditorLevel;
  compact?: boolean;
}

export function EditorBadge({ level, compact = false }: EditorBadgeProps) {
  const meta = getEditorLevelMeta(level);

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 font-comic text-[10px] px-2 py-0.5 border-2 border-ink bg-comic-blue text-white uppercase"
        title={meta.label}
      >
        {meta.pin} Editor
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-comic text-xs px-2.5 py-1 border-2 border-ink bg-comic-blue text-white">
      <span>{meta.pin}</span>
      <span>Verified RPG Editor — {meta.label}</span>
    </span>
  );
}
