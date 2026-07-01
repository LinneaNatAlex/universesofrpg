import { readJson, writeJson } from "@/lib/browser-storage";
import { isFriend } from "@/lib/friends-store";
import type {
  ChatMessage,
  Conversation,
  ConversationParticipant,
  ConversationType,
} from "@/types/database";

const STORAGE_KEY = "uorpg-messages";

interface MessagesState {
  conversations: Conversation[];
  messages: ChatMessage[];
}

export type MessagesPersistState = MessagesState;

let conversations: Conversation[] = [];
let messages: ChatMessage[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function userKey(username: string) {
  return username.toLowerCase();
}

function load() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  const state = readJson<MessagesState>(STORAGE_KEY, { conversations: [], messages: [] });
  conversations = Array.isArray(state.conversations) ? state.conversations : [];
  messages = Array.isArray(state.messages) ? state.messages : [];
}

function ensureLoaded() {
  load();
}

function persist() {
  writeJson(STORAGE_KEY, { conversations, messages });
  if (typeof window !== "undefined") {
    void import("@/lib/message-sync").then(({ schedulePrivateMessagesPush }) => {
      schedulePrivateMessagesPush({ conversations, messages });
    });
  }
}

export function buildMessagesPersistState(): MessagesPersistState {
  ensureLoaded();
  return { conversations: [...conversations], messages: [...messages] };
}

export function applyMessagesPersistState(state: MessagesPersistState): void {
  conversations = Array.isArray(state.conversations) ? [...state.conversations] : [];
  messages = Array.isArray(state.messages) ? [...state.messages] : [];
  storageLoaded = true;
  notify();
}

export async function syncMessagesToServer(): Promise<void> {
  if (typeof window === "undefined") return;
  const { pushPrivateMessagesPlatformState } = await import("@/lib/message-sync");
  await pushPrivateMessagesPlatformState(buildMessagesPersistState());
}

export function subscribeMessages(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isParticipant(conversation: Conversation, username: string): boolean {
  const key = userKey(username);
  return conversation.participants.some((p) => userKey(p.username) === key);
}

function touchConversation(conversationId: string, preview: string) {
  const conv = conversations.find((c) => c.id === conversationId);
  if (!conv) return;
  conv.updated_at = new Date().toISOString();
  conv.last_message_preview = preview.slice(0, 120);
}

export function getConversationsForUser(username: string): Conversation[] {
  ensureLoaded();
  const key = userKey(username);
  return conversations
    .filter((c) => c.participants.some((p) => userKey(p.username) === key))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export function getConversation(id: string): Conversation | undefined {
  ensureLoaded();
  return conversations.find((c) => c.id === id);
}

export function getMessages(conversationId: string): ChatMessage[] {
  ensureLoaded();
  return messages
    .filter((m) => m.conversation_id === conversationId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function getUnreadCount(username: string): number {
  ensureLoaded();
  const key = userKey(username);
  const convIds = new Set(
    conversations
      .filter((c) => c.participants.some((p) => userKey(p.username) === key))
      .map((c) => c.id)
  );
  return messages.filter(
    (m) =>
      convIds.has(m.conversation_id) &&
      userKey(m.author_username) !== key &&
      !m.read_by.some((u) => userKey(u) === key)
  ).length;
}

export function markConversationRead(conversationId: string, username: string): void {
  ensureLoaded();
  const key = userKey(username);
  let changed = false;
  for (const msg of messages) {
    if (msg.conversation_id !== conversationId) continue;
    if (msg.read_by.some((u) => userKey(u) === key)) continue;
    msg.read_by.push(key);
    changed = true;
  }
  if (changed) {
    persist();
    notify();
  }
}

function createConversation(
  type: ConversationType,
  createdBy: string,
  participants: ConversationParticipant[],
  meta: { title?: string | null; post_id?: string | null; post_title?: string | null } = {}
): Conversation {
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title: meta.title ?? null,
    post_id: meta.post_id ?? null,
    post_title: meta.post_title ?? null,
    participants,
    created_by: userKey(createdBy),
    created_at: now,
    updated_at: now,
    last_message_preview: null,
  };
  conversations.push(conversation);
  persist();
  notify();
  return conversation;
}

function findDmConversation(userA: string, userB: string): Conversation | undefined {
  const keys = new Set([userKey(userA), userKey(userB)]);
  return conversations.find(
    (c) =>
      c.type === "dm" &&
      c.participants.length === 2 &&
      c.participants.every((p) => keys.has(userKey(p.username)))
  );
}

export function findOrCreateDm(
  actorUsername: string,
  actorDisplayName: string,
  targetUsername: string,
  targetDisplayName: string,
): Conversation | null {
  ensureLoaded();
  if (userKey(actorUsername) === userKey(targetUsername)) return null;

  const existing = findDmConversation(actorUsername, targetUsername);
  if (existing) return existing;

  const now = new Date().toISOString();
  return createConversation("dm", actorUsername, [
    {
      username: userKey(actorUsername),
      display_name: actorDisplayName,
      role: "member",
      joined_at: now,
    },
    {
      username: userKey(targetUsername),
      display_name: targetDisplayName,
      role: "member",
      joined_at: now,
    },
  ]);
}

export function findOrCreateEditorReviewChat(
  editorUsername: string,
  editorDisplayName: string,
  creatorUsername: string,
  creatorDisplayName: string,
  postId: string,
  postTitle: string
): Conversation {
  ensureLoaded();
  const existing = conversations.find(
    (c) => c.type === "editor_review" && c.post_id === postId
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  return createConversation(
    "editor_review",
    editorUsername,
    [
      {
        username: userKey(editorUsername),
        display_name: editorDisplayName,
        role: "editor",
        joined_at: now,
      },
      {
        username: userKey(creatorUsername),
        display_name: creatorDisplayName,
        role: "creator",
        joined_at: now,
      },
    ],
    { title: `Review: ${postTitle}`, post_id: postId, post_title: postTitle }
  );
}

export function createGroupChat(
  ownerUsername: string,
  ownerDisplayName: string,
  title: string,
  members: { username: string; display_name: string }[]
): Conversation | null {
  ensureLoaded();
  const trimmed = title.trim();
  if (!trimmed) return null;

  const ownerKey = userKey(ownerUsername);
  const unique = new Map<string, { username: string; display_name: string }>();
  unique.set(ownerKey, { username: ownerKey, display_name: ownerDisplayName });

  for (const member of members) {
    const key = userKey(member.username);
    if (key === ownerKey) continue;
    if (!isFriend(ownerUsername, key)) continue;
    unique.set(key, { username: key, display_name: member.display_name });
  }

  if (unique.size < 2) return null;

  const now = new Date().toISOString();
  const participants: ConversationParticipant[] = [...unique.values()].map((m) => ({
    username: m.username,
    display_name: m.display_name,
    role: userKey(m.username) === ownerKey ? "owner" : "member",
    joined_at: now,
  }));

  return createConversation("group", ownerUsername, participants, { title: trimmed });
}

export function sendMessage(
  conversationId: string,
  authorUsername: string,
  authorDisplayName: string,
  body: string
): ChatMessage | null {
  ensureLoaded();
  const trimmed = body.trim();
  if (!trimmed) return null;

  const conversation = conversations.find((c) => c.id === conversationId);
  if (!conversation || !isParticipant(conversation, authorUsername)) return null;

  const message: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    conversation_id: conversationId,
    author_username: userKey(authorUsername),
    author_display_name: authorDisplayName,
    body: trimmed,
    created_at: new Date().toISOString(),
    read_by: [userKey(authorUsername)],
  };
  messages.push(message);
  touchConversation(conversationId, trimmed);
  persist();
  notify();
  return message;
}

export function removeGroupMember(
  conversationId: string,
  actorUsername: string,
  removeUsername: string
): boolean {
  ensureLoaded();
  const conversation = conversations.find((c) => c.id === conversationId);
  if (!conversation || conversation.type !== "group") return false;

  const actorKey = userKey(actorUsername);
  const actor = conversation.participants.find((p) => userKey(p.username) === actorKey);
  if (!actor || actor.role !== "owner") return false;
  if (userKey(removeUsername) === actorKey) return false;

  const before = conversation.participants.length;
  conversation.participants = conversation.participants.filter(
    (p) => userKey(p.username) !== userKey(removeUsername)
  );
  if (conversation.participants.length === before) return false;

  conversation.updated_at = new Date().toISOString();
  persist();
  notify();
  return true;
}

export function leaveConversation(conversationId: string, username: string): boolean {
  ensureLoaded();
  const conversation = conversations.find((c) => c.id === conversationId);
  if (!conversation) return false;

  const key = userKey(username);
  const participant = conversation.participants.find((p) => userKey(p.username) === key);
  if (!participant) return false;

  if (conversation.type === "group" && participant.role === "owner") {
    const nextOwner = conversation.participants.find((p) => userKey(p.username) !== key);
    if (nextOwner) nextOwner.role = "owner";
  }

  conversation.participants = conversation.participants.filter(
    (p) => userKey(p.username) !== key
  );
  conversation.updated_at = new Date().toISOString();
  persist();
  notify();
  return true;
}

export function getEditorReviewConversationForPost(postId: string): Conversation | undefined {
  ensureLoaded();
  return conversations.find((c) => c.type === "editor_review" && c.post_id === postId);
}

export function conversationTitleForUser(
  conversation: Conversation,
  viewerUsername: string
): string {
  if (conversation.type === "group" && conversation.title) return conversation.title;
  if (conversation.type === "editor_review") {
    return conversation.post_title
      ? `Editor review · ${conversation.post_title}`
      : "Editor review chat";
  }
  const key = userKey(viewerUsername);
  const other = conversation.participants.find((p) => userKey(p.username) !== key);
  return other?.display_name ?? "Direct message";
}
