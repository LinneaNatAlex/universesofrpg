"use client";

import {
  WRITING_CATEGORIES,
  type WritingCategoryId,
} from "@/lib/writing-categories";
import { cn } from "@/lib/utils";

interface WritingCategoryPickerProps {
  value: WritingCategoryId;
  onChange: (category: WritingCategoryId) => void;
  className?: string;
}

export function WritingCategoryPicker({
  value,
  onChange,
  className,
}: WritingCategoryPickerProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <label className="block text-sm font-comic text-ink">
          Category<span className="text-comic-red"> *</span>
        </label>
        <p className="text-xs text-ink-muted mt-1">
          What kind of writing is this? Shown on your post and in Explore — letters won&apos;t be
          labeled as books.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {WRITING_CATEGORIES.map((category) => {
          const active = value === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.id)}
              className={cn(
                "font-comic text-xs px-2.5 py-1.5 border-2 border-ink transition-colors text-left",
                active
                  ? "bg-comic-red text-white shadow-[2px_2px_0_#1a1a2e]"
                  : "bg-surface text-ink hover:bg-comic-yellow/50"
              )}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
