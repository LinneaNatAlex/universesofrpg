import type { ForumsPlatformState } from "@/app/api/content/forums/route";
import { isFriend } from "@/lib/friends-store";
import { readJson, writeJson } from "@/lib/browser-storage";
import { pushForumsPlatformState } from "@/lib/content-sync";
import { findUserByUsername } from "@/lib/discover-users";
import { MOCK_FORUMS } from "@/lib/mock-data";
import { getPersonaByUsername } from "@/lib/personas";
import { addPost } from "@/lib/posts-store";
import {
  addTopicChapterNotification,
  addTopicReplyNotification,
} from "@/lib/notifications-store";
import { getForumFollowerUsernames } from "@/lib/topic-follows-store";
import { normalizeTopicCategory, normalizeTopicTagList } from "@/lib/topic-tags";
import type { ForumChapter, ForumPost, RpgForum, RpgForumMeta } from "@/types/database";

const STORAGE_KEY = "uorpg-forums-state";
const MOCK_FORUM_IDS = new Set(MOCK_FORUMS.map((f) => f.id));

export type ForumsState = ForumsPlatformState;

let forums: RpgForum[] = [...MOCK_FORUMS];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function sortForums(list: RpgForum[]): RpgForum[] {
  return [...list].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function loadState(): ForumsState {
  return readJson<ForumsState>(STORAGE_KEY, { custom: [], deletedMockIds: [] });
}

function normalizePartTitle(number: number, title: string | undefined): string {
  const trimmed = title?.trim() ?? "";
  if (!trimmed || trimmed === `Chapter ${number}`) return `Part ${number}`;
  if (trimmed.startsWith("Chapter ")) return trimmed.replace(/^Chapter /, "Part ");
  return trimmed;
}

function normalizeForum(forum: RpgForum): RpgForum {
  return {
    ...forum,
    plot_synopsis: forum.plot_synopsis ?? null,
    creator_username: forum.creator_username ?? forum.members[0] ?? "unknown",
    category: forum.category
      ? normalizeTopicCategory(forum.category)
      : "fantasy",
    tags: forum.tags?.length ? normalizeTopicTagList(forum.tags) : ["rpg"],
    is_private: forum.is_private ?? false,
    is_locked: forum.is_locked ?? false,
    locked_at: forum.locked_at ?? null,
    shop_post_id: forum.shop_post_id ?? null,
    shop_price_cents: forum.shop_price_cents ?? null,
    chapters: forum.chapters.map((ch) => ({
      ...ch,
      title: normalizePartTitle(ch.number, ch.title),
    })),
  };
}

function mergeForums() {
  const state = loadState();
  const deleted = new Set(state.deletedMockIds);
  const map = new Map<string, RpgForum>();

  for (const mock of MOCK_FORUMS) {
    if (!deleted.has(mock.id)) {
      map.set(mock.id, normalizeForum(structuredClone(mock)));
    }
  }
  for (const custom of state.custom) {
    map.set(custom.id, normalizeForum(custom));
  }

  forums = sortForums([...map.values()]);
}

function ensureLoaded() {
  if (typeof window === "undefined") return;
  if (storageLoaded) return;
  storageLoaded = true;
  mergeForums();
}

export function buildForumsPersistState(): ForumsState {
  ensureLoaded();
  const currentIds = new Set(forums.map((f) => f.id));
  return {
    custom: forums.filter((f) => !MOCK_FORUM_IDS.has(f.id)),
    deletedMockIds: MOCK_FORUMS.filter((f) => !currentIds.has(f.id)).map((f) => f.id),
  };
}

export function applyForumsPersistState(state: ForumsState): void {
  if (typeof window === "undefined") return;
  writeJson(STORAGE_KEY, {
    custom: Array.isArray(state.custom) ? state.custom : [],
    deletedMockIds: Array.isArray(state.deletedMockIds) ? state.deletedMockIds : [],
  });
  storageLoaded = false;
  forums = [...MOCK_FORUMS];
  ensureLoaded();
  notify();
}

export async function syncForumsToServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return pushForumsPlatformState(buildForumsPersistState());
}

function persist(): boolean {
  if (typeof window === "undefined") return false;
  const state = buildForumsPersistState();
  const ok = writeJson(STORAGE_KEY, state);
  if (ok) {
    void syncForumsToServer();
  }
  return ok;
}

/** Persist replies/edits to demo forums too (stored as custom overrides). */
function persistForumOverride(forum: RpgForum) {
  if (!MOCK_FORUM_IDS.has(forum.id)) {
    persist();
    return;
  }

  const state = loadState();
  const overrides = state.custom.filter((f) => f.id !== forum.id);
  overrides.push(forum);
  const next = {
    ...state,
    custom: overrides,
  };
  writeJson(STORAGE_KEY, next);
  void pushForumsPlatformState(next);
}

export function subscribeForums(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAllForums(): RpgForum[] {
  ensureLoaded();
  return [...forums];
}

export function getForumById(id: string): RpgForum | undefined {
  ensureLoaded();
  return forums.find((f) => f.id === id);
}

export function isForumMember(forum: RpgForum, username: string): boolean {
  const key = username.toLowerCase();
  return forum.members.some((member) => member.toLowerCase() === key);
}

export function getForumsForMember(username: string): RpgForum[] {
  ensureLoaded();
  return forums.filter((forum) => isForumMember(forum, username));
}

export interface NewForumInput {
  title: string;
  plot_synopsis: string | null;
  book_cover_url: string | null;
  creator_username: string;
  category: string;
  tags: string[];
  member_usernames: string[];
  is_private: boolean;
  chapter_title: string;
  chapter_meta: RpgForumMeta;
  opening_post: string;
}

export function createForum(input: NewForumInput): RpgForum {
  ensureLoaded();
  const creator = input.creator_username.toLowerCase();
  const invitedFriends = input.member_usernames.filter(
    (username) =>
      username.toLowerCase() !== creator &&
      isFriend(input.creator_username, username)
  );

  const members = Array.from(
    new Set([creator, ...invitedFriends.map((u) => u.toLowerCase())])
  );

  const openingPosts: ForumPost[] = [];
  if (input.opening_post.trim()) {
    openingPosts.push({
      id: `fp-${Date.now()}`,
      author_username: input.creator_username,
      body: input.opening_post.trim(),
      created_at: new Date().toISOString(),
    });
  }

  const chapter: ForumChapter = {
    number: 1,
    title: normalizePartTitle(1, input.chapter_title),
    meta: input.chapter_meta,
    posts: openingPosts,
  };

  const forum: RpgForum = normalizeForum({
    id: `f-${Date.now()}`,
    title: input.title.trim(),
    plot_synopsis: input.plot_synopsis?.trim() || null,
    book_cover_url: input.book_cover_url?.trim() || null,
    creator_username: input.creator_username,
    category: normalizeTopicCategory(input.category),
    tags: normalizeTopicTagList(input.tags),
    members,
    is_private: input.is_private,
    is_locked: false,
    locked_at: null,
    shop_post_id: null,
    shop_price_cents: null,
    chapters: [chapter],
    created_at: new Date().toISOString(),
  });

  forums = [forum, ...forums];
  if (!persist()) {
    forums = forums.filter((f) => f.id !== forum.id);
    throw new Error(
      "Could not save your RPG topic in this browser. Try a smaller cover image or use an image URL."
    );
  }
  notify();
  return forum;
}

export interface AddForumChapterInput {
  forum_id: string;
  author_username: string;
  chapter_title: string;
  chapter_meta: RpgForumMeta;
  opening_post: string;
}

export function getNextChapterNumber(forum: RpgForum): number {
  if (forum.chapters.length === 0) return 1;
  return Math.max(...forum.chapters.map((ch) => ch.number)) + 1;
}

export function addForumChapter(input: AddForumChapterInput): ForumChapter | null {
  ensureLoaded();
  const forum = forums.find((f) => f.id === input.forum_id);
  if (!forum) return null;
  if (forum.is_locked) return null;
  if (!isForumMember(forum, input.author_username)) return null;
  if (!input.opening_post.trim()) return null;

  const chapterNumber = getNextChapterNumber(forum);
  const chapterTitle = normalizePartTitle(chapterNumber, input.chapter_title);

  const openingPost: ForumPost = {
    id: `fp-${Date.now()}`,
    author_username: input.author_username,
    body: input.opening_post.trim(),
    created_at: new Date().toISOString(),
  };

  const chapter: ForumChapter = {
    number: chapterNumber,
    title: chapterTitle,
    meta: input.chapter_meta,
    posts: [openingPost],
  };

  forum.chapters.push(chapter);
  saveForumChanges(forum);

  for (const follower of getForumFollowerUsernames(forum.id)) {
    addTopicChapterNotification({
      to_username: follower,
      forum_id: forum.id,
      forum_title: forum.title,
      chapter_number: chapter.number,
      chapter_title: chapter.title,
      author_username: input.author_username,
      excerpt: `${chapter.title} — ${openingPost.body}`,
    });
  }

  notify();
  return chapter;
}

export function addForumReply(
  forumId: string,
  chapterIndex: number,
  authorUsername: string,
  body: string
): ForumPost | null {
  ensureLoaded();
  const forum = forums.find((f) => f.id === forumId);
  if (!forum) return null;
  if (forum.is_locked) return null;
  if (!isForumMember(forum, authorUsername)) return null;

  const chapter = forum.chapters[chapterIndex];
  if (!chapter || !body.trim()) return null;

  const post: ForumPost = {
    id: `fp-${Date.now()}`,
    author_username: authorUsername,
    body: body.trim(),
    created_at: new Date().toISOString(),
  };

  chapter.posts.push(post);
  saveForumChanges(forum);

  for (const follower of getForumFollowerUsernames(forumId)) {
    addTopicReplyNotification({
      to_username: follower,
      forum_id: forum.id,
      forum_title: forum.title,
      chapter_number: chapter.number,
      post_id: post.id,
      author_username: authorUsername,
      excerpt: post.body,
    });
  }

  notify();
  return post;
}

function saveForumChanges(forum: RpgForum) {
  if (MOCK_FORUM_IDS.has(forum.id)) {
    persistForumOverride(forum);
  } else {
    persist();
  }
}

export function deleteForumPost(
  forumId: string,
  chapterIndex: number,
  postId: string
): boolean {
  ensureLoaded();
  const forum = forums.find((f) => f.id === forumId);
  if (!forum) return false;

  const chapter = forum.chapters[chapterIndex];
  if (!chapter) return false;

  const before = chapter.posts.length;
  chapter.posts = chapter.posts.filter((post) => post.id !== postId);
  if (chapter.posts.length === before) return false;

  saveForumChanges(forum);
  notify();
  return true;
}

export function setForumPrivate(
  forumId: string,
  actorUsername: string,
  isPrivate: boolean
): boolean {
  ensureLoaded();
  const forum = forums.find((f) => f.id === forumId);
  if (!forum) return false;
  if (forum.creator_username.toLowerCase() !== actorUsername.toLowerCase()) return false;
  forum.is_private = isPrivate;
  saveForumChanges(forum);
  notify();
  return true;
}

export function lockForum(forumId: string, actorUsername: string): boolean {
  ensureLoaded();
  const forum = forums.find((f) => f.id === forumId);
  if (!forum) return false;
  if (forum.creator_username.toLowerCase() !== actorUsername.toLowerCase()) return false;
  if (forum.is_locked) return false;
  forum.is_locked = true;
  forum.locked_at = new Date().toISOString();
  saveForumChanges(forum);
  notify();
  return true;
}

export function unlockForum(forumId: string, actorUsername: string): boolean {
  ensureLoaded();
  const forum = forums.find((f) => f.id === forumId);
  if (!forum) return false;
  if (forum.creator_username.toLowerCase() !== actorUsername.toLowerCase()) return false;
  if (!forum.is_locked) return false;
  forum.is_locked = false;
  forum.locked_at = null;
  saveForumChanges(forum);
  notify();
  return true;
}

export function publishForumToShop(
  forumId: string,
  actorUsername: string,
  priceCents: number
): string | null {
  ensureLoaded();
  const forum = forums.find((f) => f.id === forumId);
  if (!forum) return null;
  if (forum.creator_username.toLowerCase() !== actorUsername.toLowerCase()) return null;
  if (!forum.is_locked) return null;
  if (forum.shop_post_id) return forum.shop_post_id;
  if (!forum.book_cover_url) return null;
  if (priceCents < 100) return null;

  const profile = findUserByUsername(actorUsername);
  const persona = getPersonaByUsername(actorUsername);
  const displayName = profile?.display_name ?? actorUsername;
  const authorId = persona?.id ?? actorUsername;

  const post = addPost({
    author_id: authorId,
    type: "collab_thread",
    title: forum.title,
    description: forum.plot_synopsis,
    plot_synopsis: forum.plot_synopsis,
    content: `Full RPG topic — ${forum.chapters.length} part(s). Purchase to read all parts and replies.`,
    html_code: null,
    css_code: null,
    js_code: null,
    bbcode: null,
    preview_image_url: forum.book_cover_url,
    book_cover_url: forum.book_cover_url,
    invite_token: null,
    pricing: "one_time",
    price_cents: priceCents,
    is_code_locked: false,
    moderation_status: "pending",
    is_ai_generated: false,
    tags: [...forum.tags, "rpg-topic"],
    style_tags: [forum.category],
    author: {
      id: authorId,
      username: actorUsername.toLowerCase(),
      display_name: displayName,
      bio: null,
      avatar_url: null,
      banner_url: null,
      persona_mode: true,
      is_verified_creator: false,
      created_at: new Date().toISOString(),
    },
  });

  forum.shop_post_id = post.id;
  forum.shop_price_cents = priceCents;
  saveForumChanges(forum);
  notify();
  return post.id;
}

export function deleteForum(forumId: string): boolean {
  ensureLoaded();
  const before = forums.length;
  forums = forums.filter((forum) => forum.id !== forumId);
  if (forums.length === before) return false;

  persist();
  notify();
  return true;
}
