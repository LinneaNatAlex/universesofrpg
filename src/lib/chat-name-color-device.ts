import { sanitizeChatNameColor } from "@/lib/homepage-chat-colors";

export const USER_CHAT_COLOR_STORAGE_PREFIX = "uorpg-user-chat-color:";

export function userChatColorStorageKey(username: string): string {
  return `${USER_CHAT_COLOR_STORAGE_PREFIX}${username.trim().toLowerCase()}`;
}

export function readUserChatColorFromDevice(username: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(userChatColorStorageKey(username));
    return sanitizeChatNameColor(raw);
  } catch {
    return null;
  }
}

export function writeUserChatColorToDevice(username: string, color: string): void {
  if (typeof window === "undefined") return;
  const sanitized = sanitizeChatNameColor(color);
  if (!sanitized) return;
  try {
    localStorage.setItem(userChatColorStorageKey(username), sanitized);
  } catch {
    // ignore quota errors
  }
}

/** Client-only: merge platform colors with per-user colors on this device. */
export function mergeNameColorsWithDevicePrefs(
  platformColors: Record<string, string> | undefined
): Record<string, string> {
  const out = { ...(platformColors ?? {}) };
  if (typeof window === "undefined") return out;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(USER_CHAT_COLOR_STORAGE_PREFIX)) continue;
      const username = key.slice(USER_CHAT_COLOR_STORAGE_PREFIX.length);
      const color = sanitizeChatNameColor(localStorage.getItem(key));
      if (username && color) out[username] = color;
    }
  } catch {
    return out;
  }

  return out;
}

export function parseChatNameColorFromMetadata(
  metadata: Record<string, unknown> | undefined
): string | null {
  const raw = metadata?.chat_name_color ?? metadata?.chatNameColor;
  return sanitizeChatNameColor(typeof raw === "string" ? raw : null);
}
