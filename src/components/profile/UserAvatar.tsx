"use client";

import Image from "next/image";
import { useProfileAvatar } from "@/hooks/useProfileAvatar";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  xs: "!h-8 !w-8 !text-xs",
  sm: "!h-10 !w-10 !text-sm",
  md: "!h-12 !w-12 !text-lg",
  lg: "!h-16 !w-16 !text-2xl",
} as const;

interface UserAvatarProps {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}

export function UserAvatar({
  username,
  displayName,
  avatarUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const stored = useProfileAvatar(username);
  const src = stored ?? (avatarUrl?.trim() || null);

  return (
    <div
      className={cn(
        "comic-avatar shrink-0 relative overflow-hidden",
        SIZE_CLASS[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
          unoptimized
        />
      ) : (
        displayName.charAt(0)
      )}
    </div>
  );
}
