import { UserAvatar } from "@/components/profile/UserAvatar";
import { cn } from "@/lib/utils";

interface Actor {
  username: string;
  display_name: string;
}

interface NotificationActorAvatarsProps {
  actors: Actor[];
  className?: string;
}

const AVATAR_RING =
  "border-2 border-surface shadow-[1px_1px_0_#1a1a2e]";

export function NotificationActorAvatars({
  actors,
  className,
}: NotificationActorAvatarsProps) {
  const shown = actors.slice(0, 2);
  if (shown.length === 0) return null;

  if (shown.length === 1) {
    return (
      <UserAvatar
        username={shown[0].username}
        displayName={shown[0].display_name}
        size="xs"
        className={cn(AVATAR_RING, "shrink-0", className)}
      />
    );
  }

  return (
    <div
      className={cn("relative h-[52px] w-[52px] shrink-0", className)}
      aria-hidden
    >
      {/* Back — sits higher (top-left) */}
      <UserAvatar
        username={shown[0].username}
        displayName={shown[0].display_name}
        size="xs"
        className={cn("absolute top-0 left-0 z-10", AVATAR_RING)}
      />
      {/* Front — lower-right; top-left corner crosses over back's bottom-right */}
      <UserAvatar
        username={shown[1].username}
        displayName={shown[1].display_name}
        size="xs"
        className={cn("absolute top-5 left-5 z-20", AVATAR_RING)}
      />
    </div>
  );
}
