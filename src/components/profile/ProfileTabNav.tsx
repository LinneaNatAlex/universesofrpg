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
      className="border-t-4 border-ink bg-comic-yellow/50 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
      aria-label="Profile sections"
    >
      <div className="flex w-max min-w-full md:w-full">
        {tabs.map(({ id, label, shortLabel, icon: Icon, count }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 md:flex-1 flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5",
                "px-3 sm:px-4 py-2.5 sm:py-3 font-comic text-xs sm:text-sm border-r-2 border-ink last:border-r-0",
                "transition-colors min-w-[4.25rem] sm:min-w-[5.5rem] md:min-w-0",
                active ? "bg-comic-red text-white" : "text-ink hover:bg-comic-yellow"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap leading-tight sm:hidden">{shortLabel}</span>
              <span className="whitespace-nowrap leading-tight hidden sm:inline">{label}</span>
              {count !== undefined && (
                <span
                  className={cn(
                    "text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 border border-ink leading-none",
                    active ? "bg-white/20" : "bg-surface"
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
