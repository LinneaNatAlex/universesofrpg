"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface ProfileTabItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  count?: number;
}

interface ProfileTabNavProps {
  tabs: ProfileTabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export function ProfileTabNav({ tabs, activeId, onChange }: ProfileTabNavProps) {
  return (
    <nav
      className="border-t-4 border-ink bg-comic-yellow/40 px-3 py-3 sm:px-4 sm:py-3.5"
      aria-label="Profile sections"
    >
      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, shortLabel, icon: Icon, count }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 sm:gap-2",
                "px-3 sm:px-3.5 py-2 font-comic text-xs sm:text-sm",
                "border-2 border-ink transition-[transform,background-color,box-shadow]",
                active
                  ? "bg-comic-red text-white shadow-[3px_3px_0_var(--ink)] -translate-y-px"
                  : "bg-surface text-ink hover:bg-comic-yellow hover:-translate-y-px hover:shadow-[2px_2px_0_var(--ink)]"
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap leading-none sm:hidden">{shortLabel}</span>
              <span className="whitespace-nowrap leading-none hidden sm:inline">{label}</span>
              {count !== undefined && (
                <span
                  className={cn(
                    "text-[10px] sm:text-[11px] min-w-[1.125rem] px-1 py-0.5 border leading-none text-center tabular-nums",
                    active ? "border-white/40 bg-white/15" : "border-ink bg-comic-yellow/60"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
