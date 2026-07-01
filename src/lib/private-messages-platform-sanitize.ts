import type { PrivateMessagesPlatformState } from "@/app/api/content/private-messages/route";
import { migrateUsername, migrateDisplayName } from "@/lib/persona-rename";
import type {
  ChatMessage,
  Conversation,
  ConversationParticipant,
  ConversationParticipantRole,
  ConversationType,
} from "@/types/database";

const MAX_CONVERSATIONS = 5_000;
const MAX_MESSAGES = 50_000;
const MAX_BODY = 4_000;
const MAX_TITLE = 200;
const MAX_DISPLAY_NAME = 120;

function normalizeUsername(value: string): string {
  return migrateUsername(value.toLowerCase().trim());
}

function validConversationType(value: string): value is ConversationType {
  return value === "dm" || value === "group" || value === "editor_review";
}

function validRole(value: string): value is ConversationParticipantRole {
  return (
    value === "owner" ||
    value === "member" ||
    value === "editor" ||
    value === "creator"
  );
}

function sanitizeParticipant(
  raw: ConversationParticipant,
): ConversationParticipant | null {
  if (!raw?.username) return null;
  const username = normalizeUsername(raw.username);
  return {
    username,
    display_name: migrateDisplayName(
      username,
      String(raw.display_name ?? username),
    ).slice(0, MAX_DISPLAY_NAME),
    role: validRole(raw.role) ? raw.role : "member",
    joined_at: raw.joined_at ?? new Date().toISOString(),
  };
}

function sanitizeConversation(raw: Conversation): Conversation | null {
  if (!raw?.id || !validConversationType(raw.type)) return null;
  const participants = (raw.participants ?? [])
    .map(sanitizeParticipant)
    .filter((p): p is ConversationParticipant => p !== null);
  if (participants.length < 2) return null;

  return {
    id: String(raw.id).slice(0, 80),
    type: raw.type,
    title: raw.title ? String(raw.title).slice(0, MAX_TITLE) : null,
    post_id: raw.post_id ? String(raw.post_id).slice(0, 80) : null,
    post_title: raw.post_title ? String(raw.post_title).slice(0, MAX_TITLE) : null,
    participants,
    created_by: normalizeUsername(raw.created_by ?? participants[0].username),
    created_at: raw.created_at ?? new Date().toISOString(),
    updated_at: raw.updated_at ?? raw.created_at ?? new Date().toISOString(),
    last_message_preview: raw.last_message_preview
      ? String(raw.last_message_preview).slice(0, 120)
      : null,
  };
}

function sanitizeMessage(raw: ChatMessage): ChatMessage | null {
  if (!raw?.id || !raw.conversation_id || !raw.author_username) return null;
  const body = String(raw.body ?? "").trim();
  if (!body) return null;

  const author = normalizeUsername(raw.author_username);
  const readBy = Array.isArray(raw.read_by)
    ? [...new Set(raw.read_by.map((u) => normalizeUsername(String(u))))]
    : [author];

  return {
    id: String(raw.id).slice(0, 80),
    conversation_id: String(raw.conversation_id).slice(0, 80),
    author_username: author,
    author_display_name: migrateDisplayName(
      author,
      String(raw.author_display_name ?? author),
    ).slice(0, MAX_DISPLAY_NAME),
    body: body.slice(0, MAX_BODY),
    created_at: raw.created_at ?? new Date().toISOString(),
    read_by: readBy,
  };
}

export function sanitizePrivateMessagesPlatformState(
  state: PrivateMessagesPlatformState,
): PrivateMessagesPlatformState {
  const convSeen = new Set<string>();
  const conversations: Conversation[] = [];

  for (const raw of state.conversations ?? []) {
    const item = sanitizeConversation(raw);
    if (!item || convSeen.has(item.id)) continue;
    convSeen.add(item.id);
    conversations.push(item);
    if (conversations.length >= MAX_CONVERSATIONS) break;
  }

  const convIds = new Set(conversations.map((c) => c.id));
  const msgSeen = new Set<string>();
  const messages: ChatMessage[] = [];

  for (const raw of state.messages ?? []) {
    const item = sanitizeMessage(raw);
    if (!item || msgSeen.has(item.id)) continue;
    if (!convIds.has(item.conversation_id)) continue;
    msgSeen.add(item.id);
    messages.push(item);
    if (messages.length >= MAX_MESSAGES) break;
  }

  return { conversations, messages };
}
