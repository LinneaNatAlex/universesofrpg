import { readJson, writeJson } from "@/lib/browser-storage";

export type NotificationType =
  | "topic_reply"
  | "topic_chapter"
  | "post_comment"
  | "post_like";

interface NotificationBase {
  id: string;
  to_username: string;
  read: boolean;
  created_at: string;
}

export interface TopicReplyNotification extends NotificationBase {
  type: "topic_reply";
  forum_id: string;
  forum_title: string;
  chapter_number: number;
  chapter_title?: string;
  post_id: string;
  author_username: string;
  excerpt: string;
}

export interface TopicChapterNotification extends NotificationBase {
  type: "topic_chapter";
  forum_id: string;
  forum_title: string;
  chapter_number: number;
  chapter_title?: string;
  post_id: string;
  author_username: string;
  excerpt: string;
}

export interface PostCommentActor {
  username: string;
  display_name: string;
  comment_id: string;
  excerpt: string;
}

export interface PostCommentNotification extends NotificationBase {
  type: "post_comment";
  post_id: string;
  post_title: string;
  actors: PostCommentActor[];
}

export interface PostLikeNotification extends NotificationBase {
  type: "post_like";
  post_id: string;
  post_title: string;
  actors: { username: string; display_name: string }[];
}

export type UserNotification =
  | TopicReplyNotification
  | TopicChapterNotification
  | PostCommentNotification
  | PostLikeNotification;

const STORAGE_KEY = "uorpg-notifications";

let notifications: UserNotification[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function migrateNotification(raw: UserNotification): UserNotification {
  if (raw.type !== "post_comment") return raw;
  if (Array.isArray(raw.actors)) return raw;

  const legacy = raw as PostCommentNotification & {
    author_username?: string;
    author_display_name?: string;
    comment_id?: string;
    excerpt?: string;
  };

  if (!legacy.author_username || !legacy.comment_id) return raw;

  return {
    id: legacy.id,
    to_username: legacy.to_username,
    read: legacy.read,
    created_at: legacy.created_at,
    type: "post_comment",
    post_id: legacy.post_id,
    post_title: legacy.post_title,
    actors: [
      {
        username: legacy.author_username,
        display_name: legacy.author_display_name ?? legacy.author_username,
        comment_id: legacy.comment_id,
        excerpt: legacy.excerpt ?? "",
      },
    ],
  };
}

function mergeCommentNotifications(list: UserNotification[]): UserNotification[] {
  const merged = new Map<string, PostCommentNotification>();
  const rest: UserNotification[] = [];

  for (const item of list) {
    if (item.type !== "post_comment") {
      rest.push(item);
      continue;
    }

    const key = `${userKey(item.to_username)}:${item.post_id}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...item, actors: [...item.actors] });
      continue;
    }

    for (const actor of item.actors) {
      if (!existing.actors.some((a) => a.comment_id === actor.comment_id)) {
        existing.actors.push(actor);
      }
    }
    existing.actors.sort(
      (a, b) =>
        existing.actors.indexOf(a) - existing.actors.indexOf(b)
    );
    if (new Date(item.created_at) > new Date(existing.created_at)) {
      existing.created_at = item.created_at;
    }
    existing.read = existing.read && item.read;
  }

  return [...rest, ...merged.values()];
}

function load() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  const raw = readJson<UserNotification[]>(STORAGE_KEY, []);
  notifications = mergeCommentNotifications(raw.map(migrateNotification));
}

function ensureLoaded() {
  load();
}

function persist() {
  writeJson(STORAGE_KEY, notifications);
}

function userKey(username: string) {
  return username.toLowerCase();
}

function bumpToTop(item: UserNotification) {
  notifications = [item, ...notifications.filter((n) => n.id !== item.id)];
}

export function subscribeNotifications(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNotifications(username: string): UserNotification[] {
  ensureLoaded();
  const key = userKey(username);
  return notifications
    .filter((n) => userKey(n.to_username) === key)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getUnreadNotificationCount(username: string): number {
  return getNotifications(username).filter((n) => !n.read).length;
}

export function formatActorNames(
  actors: { display_name: string }[],
  maxNames = 2
): string {
  if (actors.length === 0) return "Someone";
  if (actors.length === 1) return actors[0].display_name;
  if (actors.length === 2) {
    return `${actors[0].display_name} and ${actors[1].display_name}`;
  }
  if (maxNames === 1) {
    return `${actors[0].display_name}... more`;
  }
  const shown = actors
    .slice(0, maxNames)
    .map((a) => a.display_name)
    .join(", ");
  const others = actors.length - maxNames;
  return `${shown} and ${others} more`;
}

/** @deprecated Use formatActorNames */
export function formatLikeActorNames(
  actors: PostLikeNotification["actors"],
  maxNames = 2
): string {
  return formatActorNames(actors, maxNames);
}

export function addTopicReplyNotification(input: {
  to_username: string;
  forum_id: string;
  forum_title: string;
  chapter_number: number;
  post_id: string;
  author_username: string;
  excerpt: string;
}): void {
  ensureLoaded();
  const to = userKey(input.to_username);
  const author = userKey(input.author_username);
  if (to === author) return;

  const duplicate = notifications.some(
    (n) => n.type === "topic_reply" && n.post_id === input.post_id && userKey(n.to_username) === to
  );
  if (duplicate) return;

  notifications = [
    {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      to_username: to,
      type: "topic_reply",
      forum_id: input.forum_id,
      forum_title: input.forum_title,
      chapter_number: input.chapter_number,
      post_id: input.post_id,
      author_username: input.author_username,
      excerpt: input.excerpt.slice(0, 140),
      created_at: new Date().toISOString(),
      read: false,
    },
    ...notifications,
  ];
  persist();
  notify();
}

export function addTopicChapterNotification(input: {
  to_username: string;
  forum_id: string;
  forum_title: string;
  chapter_number: number;
  chapter_title: string;
  author_username: string;
  excerpt: string;
}): void {
  ensureLoaded();
  const to = userKey(input.to_username);
  const author = userKey(input.author_username);
  if (to === author) return;

  const dedupeId = `ch-${input.forum_id}-${input.chapter_number}`;
  const duplicate = notifications.some(
    (n) => n.type === "topic_chapter" && n.post_id === dedupeId && userKey(n.to_username) === to
  );
  if (duplicate) return;

  notifications = [
    {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      to_username: to,
      type: "topic_chapter",
      forum_id: input.forum_id,
      forum_title: input.forum_title,
      chapter_number: input.chapter_number,
      chapter_title: input.chapter_title,
      post_id: dedupeId,
      author_username: input.author_username,
      excerpt: input.excerpt.slice(0, 140),
      created_at: new Date().toISOString(),
      read: false,
    },
    ...notifications,
  ];
  persist();
  notify();
}

export function addPostCommentNotification(input: {
  to_username: string;
  post_id: string;
  post_title: string;
  comment_id: string;
  author_username: string;
  author_display_name: string;
  excerpt: string;
}): void {
  ensureLoaded();
  const to = userKey(input.to_username);
  const author = userKey(input.author_username);
  if (to === author) return;

  const actor: PostCommentActor = {
    username: author,
    display_name: input.author_display_name,
    comment_id: input.comment_id,
    excerpt: input.excerpt.slice(0, 140),
  };

  const existing = notifications.find(
    (n): n is PostCommentNotification =>
      n.type === "post_comment" &&
      userKey(n.to_username) === to &&
      n.post_id === input.post_id
  );

  if (existing) {
    const duplicateComment = existing.actors.some(
      (a) => a.comment_id === input.comment_id
    );
    if (duplicateComment) return;

    const already = existing.actors.some((a) => userKey(a.username) === author);
    if (!already) {
      existing.actors.unshift(actor);
    } else {
      existing.actors = [
        actor,
        ...existing.actors.filter((a) => userKey(a.username) !== author),
      ];
    }
    existing.read = false;
    existing.created_at = new Date().toISOString();
    bumpToTop(existing);
    persist();
    notify();
    return;
  }

  notifications = [
    {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      to_username: to,
      type: "post_comment",
      post_id: input.post_id,
      post_title: input.post_title,
      actors: [actor],
      created_at: new Date().toISOString(),
      read: false,
    },
    ...notifications,
  ];
  persist();
  notify();
}

export function addPostLikeNotification(input: {
  to_username: string;
  post_id: string;
  post_title: string;
  actor_username: string;
  actor_display_name: string;
}): void {
  ensureLoaded();
  const to = userKey(input.to_username);
  const actor = userKey(input.actor_username);
  if (to === actor) return;

  const existing = notifications.find(
    (n): n is PostLikeNotification =>
      n.type === "post_like" &&
      userKey(n.to_username) === to &&
      n.post_id === input.post_id
  );

  if (existing) {
    const already = existing.actors.some((a) => userKey(a.username) === actor);
    if (!already) {
      existing.actors.unshift({
        username: actor,
        display_name: input.actor_display_name,
      });
    }
    existing.read = false;
    existing.created_at = new Date().toISOString();
    bumpToTop(existing);
    persist();
    notify();
    return;
  }

  notifications = [
    {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      to_username: to,
      type: "post_like",
      post_id: input.post_id,
      post_title: input.post_title,
      actors: [
        {
          username: actor,
          display_name: input.actor_display_name,
        },
      ],
      created_at: new Date().toISOString(),
      read: false,
    },
    ...notifications,
  ];
  persist();
  notify();
}

export function removePostLikeNotificationActor(input: {
  to_username: string;
  post_id: string;
  actor_username: string;
}): void {
  ensureLoaded();
  const to = userKey(input.to_username);
  const actor = userKey(input.actor_username);

  const index = notifications.findIndex(
    (n): n is PostLikeNotification =>
      n.type === "post_like" &&
      userKey(n.to_username) === to &&
      n.post_id === input.post_id
  );
  if (index < 0) return;

  const item = notifications[index] as PostLikeNotification;
  item.actors = item.actors.filter((a) => userKey(a.username) !== actor);

  if (item.actors.length === 0) {
    notifications = notifications.filter((n) => n.id !== item.id);
  }

  persist();
  notify();
}

export function notificationHref(item: UserNotification): string {
  if (item.type === "post_comment") {
    return `/post/${item.post_id}#comments`;
  }
  if (item.type === "post_like") {
    return `/post/${item.post_id}`;
  }
  return `/forum/${item.forum_id}?chapter=${item.chapter_number}`;
}

export function notificationHeadline(item: UserNotification): string {
  if (item.type === "topic_chapter") {
    return `New chapter in ${item.forum_title}`;
  }
  if (item.type === "topic_reply") {
    return `New reply in ${item.forum_title}`;
  }
  if (item.type === "post_comment") {
    const count = item.actors.length;
    if (count === 1) {
      return `${item.actors[0].display_name} commented on your post`;
    }
    if (count === 2) {
      return `${item.actors[0].display_name} and ${item.actors[1].display_name} commented on your post`;
    }
    return `${formatActorNames(item.actors, 1)} commented on your post`;
  }
  if (item.type === "post_like") {
    const count = item.actors.length;
    if (count === 1) {
      return `${item.actors[0].display_name} liked your post`;
    }
    return `${count} people liked your post`;
  }
  return "Notification";
}

export function markNotificationRead(id: string): void {
  ensureLoaded();
  const item = notifications.find((n) => n.id === id);
  if (!item || item.read) return;
  item.read = true;
  persist();
  notify();
}

export function markAllNotificationsRead(username: string): void {
  ensureLoaded();
  const key = userKey(username);
  let changed = false;
  for (const item of notifications) {
    if (userKey(item.to_username) === key && !item.read) {
      item.read = true;
      changed = true;
    }
  }
  if (changed) {
    persist();
    notify();
  }
}
