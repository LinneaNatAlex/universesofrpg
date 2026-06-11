import type { ReactNode } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { cn } from "@/lib/utils";

interface CommentAuthorRowProps {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  meta?: ReactNode;
  actions?: ReactNode;
  size?: "xs" | "sm";
  className?: string;
  children?: ReactNode;
}

export function CommentAuthorRow({
  username,
  displayName,
  avatarUrl,
  meta,
  actions,
  size = "sm",
  className,
  children,
}: CommentAuthorRowProps) {
  return (
    <div className={cn("flex items-start gap-2.5 min-w-0", className)}>
      <Link href={`/profile/${username}`} className="shrink-0 hover:opacity-90 transition-opacity">
        <UserAvatar
          username={username}
          displayName={displayName}
          avatarUrl={avatarUrl}
          size={size}
        />
      </Link>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/profile/${username}`}
              className="font-comic text-sm text-comic-red hover:underline leading-tight"
            >
              {displayName}
            </Link>
            {meta && (
              <p className="text-xs text-ink-muted mt-0.5 leading-snug">{meta}</p>
            )}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
