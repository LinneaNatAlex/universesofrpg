"use client";

import Link from "next/link";
import { BookOpen, MessagesSquare, PenTool, Settings, User } from "lucide-react";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { cn } from "@/lib/utils";

interface ProfileActionsProps {
  isOwnProfile: boolean;
}

const linkBtn =
  "inline-flex items-center justify-center font-comic font-bold h-8 px-3 text-sm border-2 border-ink transition-all duration-150";

export function ProfileActions({ isOwnProfile }: ProfileActionsProps) {
  const identity = useActingIdentity();

  if (!isOwnProfile || !identity) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Link
        href={`/profile/${identity.username}/edit`}
        className={cn(
          linkBtn,
          "bg-comic-blue text-white shadow-[2px_2px_0_#1a1a2e] hover:shadow-[1px_1px_0_#1a1a2e] hover:translate-x-0.5 hover:translate-y-0.5"
        )}
      >
        <User className="h-4 w-4 mr-1.5" />
        Edit persona page
      </Link>
      <Link
        href="/create"
        className={cn(
          linkBtn,
          "bg-comic-red text-white shadow-[3px_3px_0_#1a1a2e] hover:shadow-[1px_1px_0_#1a1a2e] hover:translate-x-0.5 hover:translate-y-0.5"
        )}
      >
        <PenTool className="h-4 w-4 mr-1.5" />
        Create post
      </Link>
      <Link
        href="/discussions/new"
        className={cn(
          linkBtn,
          "bg-surface text-ink shadow-[2px_2px_0_#1a1a2e] hover:bg-comic-yellow"
        )}
      >
        <MessagesSquare className="h-4 w-4 mr-1.5" />
        New discussion
      </Link>
      <Link
        href="/forum/new"
        className={cn(
          linkBtn,
          "bg-surface text-ink shadow-[2px_2px_0_#1a1a2e] hover:bg-comic-yellow"
        )}
      >
        <BookOpen className="h-4 w-4 mr-1.5" />
        New RPG topic
      </Link>
      <Link
        href="/settings"
        className={cn(linkBtn, "bg-transparent text-ink-muted hover:text-ink hover:bg-surface")}
      >
        <Settings className="h-4 w-4 mr-1.5" />
        Settings
      </Link>
    </div>
  );
}
