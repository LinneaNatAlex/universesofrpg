"use client";

interface CharacterCreationOptionProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CharacterCreationOption({
  checked,
  onChange,
}: CharacterCreationOptionProps) {
  return (
    <label className="flex items-start gap-2 text-sm font-comic text-ink cursor-pointer comic-panel px-4 py-3 border-2 border-ink bg-comic-yellow/15">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <span>
        <span className="block">Save to Character Creations only</span>
        <span className="block text-xs font-normal text-ink-muted mt-1 leading-snug">
          Keeps this on your profile&apos;s Character Creations tab for use in RPG topics —
          not on the home feed or Explore.
        </span>
      </span>
    </label>
  );
}
