"use client";

import { useState } from "react";
import {
  MAX_WRITING_TAGS,
  sanitizeTagInput,
  WRITING_TAG_SUGGESTIONS,
} from "@/lib/writing-tags";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface WritingTagPickerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  className?: string;
  suggestions?: readonly string[];
  label?: string;
  hint?: string;
  maxTags?: number;
}

export function WritingTagPicker({
  value,
  onChange,
  className,
  suggestions = WRITING_TAG_SUGGESTIONS,
  label = "Tags",
  hint = "Extra tags for Explore — genre, mood, RPG, horror, and more. Pick your main category above first.",
  maxTags = MAX_WRITING_TAGS,
}: WritingTagPickerProps) {
  const [customInput, setCustomInput] = useState("");

  function addTag(raw: string) {
    const tag = sanitizeTagInput(raw);
    if (!tag || value.includes(tag)) return;
    if (value.length >= maxTags) return;
    onChange([...value, tag]);
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleAddCustom() {
    addTag(customInput);
    setCustomInput("");
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <label className="block text-sm font-comic text-ink">
          {label}<span className="text-comic-red"> *</span>
        </label>
        <p className="text-xs text-ink-muted mt-1">{hint}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((tag) => {
          const active = value.includes(tag);
          const disabled = !active && value.length >= maxTags;
          return (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => (active ? removeTag(tag) : addTag(tag))}
              className={cn(
                "font-comic text-xs px-2.5 py-1 border-2 border-ink transition-colors",
                active
                  ? "bg-comic-yellow text-ink"
                  : "bg-surface text-ink-muted hover:bg-comic-yellow/50",
                disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              #{tag}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          placeholder="Custom tag — e.g. villanelle"
          className="flex-1 min-w-[12rem] border-2 border-ink bg-surface px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleAddCustom}
          disabled={value.length >= maxTags}
          className="px-3 py-2 text-sm font-comic border-2 border-ink bg-surface hover:bg-comic-yellow disabled:opacity-40"
        >
          Add tag
        </button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 font-comic text-xs px-2 py-1 border-2 border-ink bg-comic-red text-white"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:opacity-80"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-[11px] text-ink-muted">
        {value.length}/{maxTags} tags · letters, numbers, and hyphens only
      </p>
    </div>
  );
}
