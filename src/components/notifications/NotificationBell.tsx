"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useAccountIdentity } from "@/hooks/useAccountIdentity";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationListItem } from "@/components/notifications/NotificationListItem";
import { markAllNotificationsRead } from "@/lib/notifications-store";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const account = useAccountIdentity();
  const identity = useActingIdentity();
  const notificationUsername = account?.username ?? identity?.username ?? null;
  const { items, unreadCount } = useNotifications(notificationUsername);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!notificationUsername) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center border-2 border-ink bg-surface hover:bg-comic-yellow transition-colors",
          open && "bg-comic-yellow"
        )}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4 text-ink" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] px-0.5 flex items-center justify-center bg-comic-red text-white text-[10px] font-comic border border-ink">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "z-50 border-2 border-ink bg-surface shadow-[4px_4px_0_#1a1a2e]",
            "fixed left-3 right-3 top-[3.75rem] w-auto max-w-none",
            "sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-1 sm:w-72 sm:max-w-[calc(100vw-2rem)]"
          )}
        >
          <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 border-b-2 border-ink bg-comic-yellow/50">
            <p className="font-comic text-xs sm:text-sm text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsRead(notificationUsername)}
                className="text-[10px] font-comic text-comic-red hover:underline shrink-0"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[min(14rem,45vh)] sm:max-h-60 overflow-y-auto overflow-x-hidden">
            {items.length === 0 ? (
              <li className="px-3 py-4 sm:px-4 sm:py-6 text-center text-xs sm:text-sm text-ink-muted font-comic">
                No notifications yet.
              </li>
            ) : (
              items.map((item) => (
                <NotificationListItem
                  key={item.id}
                  item={item}
                  onNavigate={() => setOpen(false)}
                />
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
