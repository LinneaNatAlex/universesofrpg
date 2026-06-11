"use client";

import { useEffect, useState } from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  subscribeNotifications,
  type UserNotification,
} from "@/lib/notifications-store";

export function useNotifications(username: string | null) {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!username) {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    const refresh = () => {
      setItems(getNotifications(username));
      setUnreadCount(getUnreadNotificationCount(username));
    };

    refresh();
    return subscribeNotifications(refresh);
  }, [username]);

  return { items, unreadCount };
}
