"use client";

import { Users } from "lucide-react";
import { useCreatorFollowerCount } from "@/hooks/useCreatorFollowerCount";
import { cn } from "@/lib/utils";

interface ProfileFollowerCountProps {
  username: string;
  className?: string;
}

export function ProfileFollowerCount({ username, className }: ProfileFollowerCountProps) {
  const count = useCreatorFollowerCount(username);
  const label = count === 1 ? "follower" : "followers";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-comic text-ink border-2 border-ink bg-surface px-2 py-0.5",
        className
      )}
    >
      <Users className="h-3.5 w-3.5 shrink-0" />
      <span>
        {count} {label}
      </span>
    </span>
  );
}
