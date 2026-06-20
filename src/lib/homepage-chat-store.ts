import type { HomepageChatPlatformState } from "@/app/api/content/homepage-chat/route";
import { readJson, writeJson } from "@/lib/browser-storage";
import {
  pushHomepageChatPlatformState,
  scheduleHomepageChatPlatformPush,
} from "@/lib/content-sync";
import {
  DEFAULT_CHAT_NAME_COLOR,
  resolveChatNameColor,
  sanitizeChatNameColor,
} from "@/lib/homepage-chat-colors";
import {
  mergeNameColorsWithDevicePrefs,
  readUserChatColorFromDevice,
  writeUserChatColorToDevice,
} from "@/lib/chat-name-color-device";
import { MAX_HOMEPAGE_CHAT_BODY } from "@/lib/homepage-chat-platform-sanitize";
import type { HomepageChatMessage } from "@/types/database";

const STORAGE_KEY = "uorpg-homepage-chat-state";

export type HomepageChatState = HomepageChatPlatformState;

let messages: HomepageChatMessage[] = [];
let deletedIds: string[] = [];
let nameColors: Record<string, string> = {};
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function sortMessages(list: HomepageChatMessage[]): HomepageChatMessage[] {
  return [...list].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

function rebuildFromState(state: HomepageChatState) {
  const deleted = new Set(state.deletedIds ?? []);
  deletedIds = [...deleted];
  nameColors = mergeNameColorsWithDevicePrefs(state.nameColors ?? {});
  messages = sortMessages(
    (state.messages ?? []).filter((message) => !deleted.has(message.id))
  );
}

function ensureLoaded() {
  if (typeof window === "undefined") return;
  if (storageLoaded) return;
  storageLoaded = true;
  const state = readJson<HomepageChatState>(STORAGE_KEY, {
    messages: [],
    deletedIds: [],
    nameColors: {},
  });
  rebuildFromState(state);
}

export function buildHomepageChatPersistState(): HomepageChatState {
  ensureLoaded();
  return {
    messages: [...messages],
    deletedIds: [...deletedIds],
    nameColors: { ...nameColors },
  };
}

export function applyHomepageChatPersistState(state: HomepageChatState): void {
  if (typeof window === "undefined") return;
  const mergedColors = mergeNameColorsWithDevicePrefs(
    state.nameColors && typeof state.nameColors === "object" ? state.nameColors : {}
  );
  writeJson(STORAGE_KEY, {
    messages: Array.isArray(state.messages) ? state.messages : [],
    deletedIds: Array.isArray(state.deletedIds) ? state.deletedIds : [],
    nameColors: mergedColors,
  });
  storageLoaded = false;
  messages = [];
  deletedIds = [];
  nameColors = {};
  ensureLoaded();
  notify();
}

export async function syncHomepageChatToServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return pushHomepageChatPlatformState(buildHomepageChatPersistState());
}

function persist() {
  if (typeof window === "undefined") return;
  ensureLoaded();
  const state = buildHomepageChatPersistState();
  writeJson(STORAGE_KEY, state);
  scheduleHomepageChatPlatformPush(state);
}

export function subscribeHomepageChat(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getHomepageChatMessages(): HomepageChatMessage[] {
  ensureLoaded();
  return [...messages];
}

export function getHomepageChatNameColors(): Record<string, string> {
  ensureLoaded();
  return mergeNameColorsWithDevicePrefs(nameColors);
}

export function getHomepageChatNameColor(username: string): string {
  ensureLoaded();
  const key = username.trim().toLowerCase();
  return (
    sanitizeChatNameColor(nameColors[key]) ??
    readUserChatColorFromDevice(key) ??
    DEFAULT_CHAT_NAME_COLOR
  );
}

export function setHomepageChatNameColor(username: string, color: string): boolean {
  ensureLoaded();
  const sanitized = sanitizeChatNameColor(color);
  if (!sanitized) return false;
  const key = username.trim().toLowerCase();
  if (!key) return false;
  writeUserChatColorToDevice(key, sanitized);
  nameColors = { ...nameColors, [key]: sanitized };
  persist();
  notify();
  void syncHomepageChatToServer();
  void import("@/lib/chat-name-color-prefs").then((mod) =>
    mod.persistChatNameColorToAccount(sanitized)
  );
  return true;
}

/** Restore saved color from account metadata onto this device / chat state. */
export function restoreHomepageChatNameColorFromAccount(
  username: string,
  color: string | null | undefined
): boolean {
  const sanitized = sanitizeChatNameColor(color ?? null);
  if (!sanitized || !username.trim()) return false;
  const key = username.trim().toLowerCase();
  const current = getHomepageChatNameColor(key);
  if (current === sanitized) return false;
  writeUserChatColorToDevice(key, sanitized);
  nameColors = { ...nameColors, [key]: sanitized };
  persist();
  notify();
  void syncHomepageChatToServer();
  return true;
}

export interface SendHomepageChatMessageInput {
  author_username: string;
  author_display_name: string;
  body: string;
  author_is_admin?: boolean;
}

export function sendHomepageChatMessage(
  input: SendHomepageChatMessageInput
): HomepageChatMessage | null {
  ensureLoaded();
  const body = input.body.trim();
  if (!body || body.length > MAX_HOMEPAGE_CHAT_BODY) return null;
  if (!input.author_username.trim()) return null;

  const message: HomepageChatMessage = {
    id: `hc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    author_username: input.author_username.trim().toLowerCase(),
    author_display_name: input.author_display_name.trim() || input.author_username.trim(),
    body,
    created_at: new Date().toISOString(),
    ...(input.author_is_admin === true ? { author_is_admin: true } : {}),
  };

  messages.push(message);
  messages = sortMessages(messages);
  persist();
  notify();
  void syncHomepageChatToServer();
  return message;
}

export function deleteHomepageChatMessage(id: string): boolean {
  ensureLoaded();
  const wasPresent = messages.some((message) => message.id === id);
  const alreadyDeleted = deletedIds.includes(id);
  if (!wasPresent && alreadyDeleted) return false;

  messages = messages.filter((message) => message.id !== id);
  if (!deletedIds.includes(id)) {
    deletedIds.push(id);
  }
  persist();
  notify();
  void syncHomepageChatToServer();
  return true;
}

export function clearAllHomepageChatMessages(): number {
  ensureLoaded();
  const count = messages.length;
  if (count === 0) return 0;
  for (const message of messages) {
    if (!deletedIds.includes(message.id)) {
      deletedIds.push(message.id);
    }
  }
  messages = [];
  persist();
  notify();
  void syncHomepageChatToServer();
  return count;
}

export { DEFAULT_CHAT_NAME_COLOR };
