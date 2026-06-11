"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Mail,
  MessageSquare,
  MessagesSquare,
  PenTool,
  Shield,
  User,
  UserCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/useAdmin";
import { useEditor } from "@/hooks/useEditor";
import { useAccountIdentity } from "@/hooks/useAccountIdentity";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useFriendInbox } from "@/hooks/useFriendInbox";
import { useConversations } from "@/hooks/useConversations";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/profile/UserAvatar";

export function UserMenu() {
  const router = useRouter();
  const { isLoggedIn, loading, isAdmin } = useAdmin();
  const { isEditor } = useEditor();
  const identity = useActingIdentity();
  const account = useAccountIdentity();
  const { incoming } = useFriendInbox();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const profileHref =
    identity?.isActingAsPersona && identity.username
      ? `/profile/${identity.username}`
      : account
        ? `/profile/${account.username}`
        : "/login";

  const displayName = identity?.displayName ?? account?.displayName ?? "Account";
  const username = identity?.username ?? account?.username;
  const { unread: unreadMessages } = useConversations(username ?? null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="h-9 w-9 border-2 border-ink bg-surface animate-pulse" aria-hidden />
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/login"
          className="text-xs sm:text-sm font-comic text-ink hover:text-comic-red px-1.5 sm:px-2"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="bg-comic-red text-white font-comic text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 border-2 border-ink shadow-[2px_2px_0_#1a1a2e] hover:shadow-[1px_1px_0_#1a1a2e] hover:translate-x-0.5 hover:translate-y-0.5 transition-all whitespace-nowrap"
        >
          Join
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 pl-1 pr-2 py-1 border-2 border-ink bg-surface",
          "hover:bg-comic-yellow transition-colors max-w-[11rem]",
          open && "bg-comic-yellow"
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {username ? (
          <UserAvatar
            username={username}
            displayName={displayName}
            size="xs"
            className="!h-7 !w-7 !text-[10px] shadow-none"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center bg-comic-red text-white shrink-0">
            <User className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="hidden sm:block text-left min-w-0">
          <span className="block font-comic text-xs text-ink truncate leading-tight">
            {displayName}
          </span>
          {username && (
            <span className="block text-[10px] text-ink-muted truncate leading-tight">
              @{username}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-52 border-2 border-ink bg-surface shadow-[4px_4px_0_#1a1a2e] z-50 py-1"
        >
          <MenuLink href={profileHref} icon={User} onClick={() => setOpen(false)}>
            My profile
          </MenuLink>
          <MenuLink
            href="/settings?tab=friends"
            icon={Settings}
            onClick={() => setOpen(false)}
            badge={incoming.length > 0 ? incoming.length : undefined}
          >
            Settings
            {incoming.length > 0 ? ` · ${incoming.length} request${incoming.length === 1 ? "" : "s"}` : ""}
          </MenuLink>
          <MenuLink href="/create" icon={PenTool} onClick={() => setOpen(false)}>
            Create post
          </MenuLink>
          <MenuLink href="/discussions" icon={MessagesSquare} onClick={() => setOpen(false)}>
            Forum discussions
          </MenuLink>
          <MenuLink href="/forum" icon={MessageSquare} onClick={() => setOpen(false)}>
            RPG (Topics)
          </MenuLink>
          <MenuLink
            href="/messages"
            icon={Mail}
            onClick={() => setOpen(false)}
            badge={unreadMessages > 0 ? unreadMessages : undefined}
          >
            Messages
            {unreadMessages > 0 ? ` · ${unreadMessages} new` : ""}
          </MenuLink>
          {isEditor && (
            <MenuLink href="/editor" icon={UserCheck} onClick={() => setOpen(false)}>
              Editor portal
            </MenuLink>
          )}
          {isAdmin && (
            <MenuLink href="/admin" icon={Shield} onClick={() => setOpen(false)}>
              Admin panel
            </MenuLink>
          )}
          <div className="border-t-2 border-dashed border-ink my-1" />
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-comic text-ink-muted hover:bg-comic-yellow hover:text-comic-red transition-colors text-left"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-sm font-comic text-ink hover:bg-comic-yellow hover:text-comic-red transition-colors"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 min-w-0 truncate">{children}</span>
      {badge !== undefined && badge > 0 && (
        <span className="shrink-0 bg-comic-red text-white text-[10px] font-comic px-1.5 py-0.5 border border-ink">
          {badge}
        </span>
      )}
    </Link>
  );
}
