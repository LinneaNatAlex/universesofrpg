"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationListItem } from "@/components/notifications/NotificationListItem";
import { markAllNotificationsRead } from "@/lib/notifications-store";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const identity = useActingIdentity();
  const { items, unreadCount } = useNotifications(identity?.username ?? null);
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

  if (!identity?.username) return null;

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
        <div className="absolute right-0 top-full mt-1 w-80 max-w-[calc(100vw-2rem)] border-2 border-ink bg-surface shadow-[4px_4px_0_#1a1a2e] z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b-2 border-ink bg-comic-yellow/50">
            <p className="font-comic text-sm text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsRead(identity.username)}
                className="text-[10px] font-comic text-comic-red hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-ink-muted font-comic">
                No notifications yet — likes, comments, and topic updates show up here.
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
