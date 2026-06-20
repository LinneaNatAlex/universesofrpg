import type { HomepageChatPlatformState } from "@/app/api/content/homepage-chat/route";
import {
  sanitizeChatNameColors,
} from "@/lib/homepage-chat-colors";
import type { HomepageChatMessage } from "@/types/database";

export const MAX_HOMEPAGE_CHAT_BODY = 2_000;
export const MAX_STORED_HOMEPAGE_CHAT_MESSAGES = 1_000;

function trimField(value: string | null | undefined): string {
  if (value == null) return "";
  if (value.length > MAX_HOMEPAGE_CHAT_BODY) return value.slice(0, MAX_HOMEPAGE_CHAT_BODY);
  return value.trim();
}

function sanitizeMessage(message: HomepageChatMessage): HomepageChatMessage | null {
  const body = trimField(message.body);
  const author_username = message.author_username?.trim().toLowerCase() ?? "";
  const author_display_name = trimField(message.author_display_name);
  const id = message.id?.trim() ?? "";
  const created_at = message.created_at?.trim() ?? "";

  if (!id || !author_username || !body || !created_at) return null;

  return {
    id,
    author_username,
    author_display_name: author_display_name || author_username,
    body,
    created_at,
    ...(message.author_is_admin === true ? { author_is_admin: true } : {}),
  };
}

export function sanitizeHomepageChatPlatformState(
  state: HomepageChatPlatformState
): HomepageChatPlatformState {
  const deletedIds = Array.isArray(state.deletedIds)
    ? [...new Set(state.deletedIds.filter((id) => typeof id === "string" && id.trim()))]
    : [];

  const deletedSet = new Set(deletedIds);
  const seen = new Set<string>();
  const messages: HomepageChatMessage[] = [];

  const raw = Array.isArray(state.messages) ? state.messages : [];
  for (const item of raw) {
    const sanitized = sanitizeMessage(item);
    if (!sanitized || deletedSet.has(sanitized.id) || seen.has(sanitized.id)) continue;
    seen.add(sanitized.id);
    messages.push(sanitized);
  }

  messages.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const trimmed =
    messages.length > MAX_STORED_HOMEPAGE_CHAT_MESSAGES
      ? messages.slice(-MAX_STORED_HOMEPAGE_CHAT_MESSAGES)
      : messages;

  return {
    messages: trimmed,
    deletedIds,
    nameColors: sanitizeChatNameColors(state.nameColors),
  };
}
