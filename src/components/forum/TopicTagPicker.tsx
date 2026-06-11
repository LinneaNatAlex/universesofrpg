"use client";

import { useState } from "react";
import {
  MAX_TOPIC_TAGS,
  TOPIC_CATEGORIES,
  TOPIC_TAG_SUGGESTIONS,
  sanitizeTopicTag,
} from "@/lib/topic-tags";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface TopicTagPickerProps {
  category: string;
  tags: string[];
  onCategoryChange: (category: string) => void;
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

export function TopicTagPicker({
  category,
  tags,
  onCategoryChange,
  onTagsChange,
  className,
}: TopicTagPickerProps) {
  const [customInput, setCustomInput] = useState("");

  function addTag(raw: string) {
    const tag = sanitizeTopicTag(raw);
    if (!tag || tags.includes(tag)) return;
    if (tags.length >= MAX_TOPIC_TAGS) return;
    onTagsChange([...tags, tag]);
  }

  function removeTag(tag: string) {
    onTagsChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <label className="font-comic text-sm block mb-1">
          Category<span className="text-comic-red"> *</span>
        </label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
        >
          {TOPIC_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="font-comic text-sm block">Tags</label>
        <p className="text-xs text-ink-muted mt-1">
          Help readers find your topic — campaign, horror, play-by-post, etc.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {TOPIC_TAG_SUGGESTIONS.map((tag) => {
            const active = tags.includes(tag);
            const disabled = !active && tags.length >= MAX_TOPIC_TAGS;
            return (
              <button
                key={tag}
                type="button"
                disabled={disabled}
                onClick={() => (active ? removeTag(tag) : addTag(tag))}
                className={cn(
                  "font-comic text-xs px-2.5 py-1 border-2 border-ink",
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
        <div className="flex flex-wrap gap-2 mt-2">
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(customInput);
                setCustomInput("");
              }
            }}
            placeholder="Custom tag"
            className="flex-1 min-w-[10rem] border-2 border-ink bg-surface px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              addTag(customInput);
              setCustomInput("");
            }}
            className="px-3 py-2 text-sm font-comic border-2 border-ink bg-surface hover:bg-comic-yellow"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 font-comic text-xs px-2 py-1 border-2 border-ink bg-comic-red text-white"
              >
                #{tag}
                <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
