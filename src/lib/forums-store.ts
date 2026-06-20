import type { ForumsPlatformState } from "@/app/api/content/forums/route";
import { isFriend } from "@/lib/friends-store";
import { readJson, writeJson } from "@/lib/browser-storage";
import { pushForumsPlatformState, scheduleForumsPlatformPush } from "@/lib/content-sync";
import { findUserByUsername } from "@/lib/discover-users";
import { MOCK_FORUMS } from "@/lib/mock-data";
import { getPersonaByUsername } from "@/lib/personas";
import { addPost } from "@/lib/posts-store";
import {
  addTopicChapterNotification,
  addTopicReplyNotification,
} from "@/lib/notifications-store";
import { getForumFollowerUsernames } from "@/lib/topic-follows-store";
import {
  isMatureTopicCategory,
  MATURE_TOPIC_CATEGORY,
  normalizeTopicCategory,
  normalizeTopicTagList,
} from "@/lib/topic-tags";
import {
  applySexualContentTags,
  resolveContentRating,
} from "@/lib/content-rating";
import type { ForumChapter, ForumPost, RpgForum, RpgForumMeta, TopicCharacter } from "@/types/database";

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
  return readJson<ForumsState>(STORAGE_KEY, {
    custom: [],
    deletedMockIds: [],
    deletedCustomIds: [],
  });
}

function normalizePartTitle(number: number, title: string | undefined): string {
  const trimmed = title?.trim() ?? "";
  if (!trimmed || trimmed === `Chapter ${number}`) return `Part ${number}`;
  if (trimmed.startsWith("Chapter ")) return trimmed.replace(/^Chapter /, "Part ");
  return trimmed;
}

function normalizeForum(forum: RpgForum): RpgForum {
  const contains = forum.contains_sexual_content ?? false;
  const tags = forum.tags?.length ? normalizeTopicTagList(forum.tags) : ["rpg"];
  let category = forum.category
    ? normalizeTopicCategory(forum.category)
    : "fantasy";
  if (contains) {
    category = MATURE_TOPIC_CATEGORY;
  } else if (isMatureTopicCategory(category)) {
    category = "sandbox";
  }
  return {
    ...forum,
    plot_synopsis: forum.plot_synopsis ?? null,
    creator_username: forum.creator_username ?? forum.members[0] ?? "unknown",
    category,
    tags: applySexualContentTags(tags, contains),
    contains_sexual_content: contains,
    content_rating: resolveContentRating(contains, forum.content_rating),
    is_private: forum.is_private ?? false,
    is_locked: forum.is_locked ?? false,
    locked_at: forum.locked_at ?? null,
    shop_post_id: forum.shop_post_id ?? null,
    shop_price_cents: forum.shop_price_cents ?? null,
    chapters: forum.chapters.map((ch) => ({
      ...ch,
      title: normalizePartTitle(ch.number, ch.title),
      posts: ch.posts.map((post) => ({
        ...post,
        character_id: post.character_id ?? null,
      })),
    })),
    characters: (forum.characters ?? []).map((character) => ({
      ...character,
      age: character.age ?? null,
      linked_post_id: character.linked_post_id ?? null,
    })),
  };
}

function mergeForums() {
  const state = loadState();
  const deleted = new Set(state.deletedMockIds);
  const deletedCustom = new Set(state.deletedCustomIds ?? []);
  const map = new Map<string, RpgForum>();

  for (const mock of MOCK_FORUMS) {
    if (!deleted.has(mock.id)) {
      map.set(mock.id, normalizeForum(structuredClone(mock)));
    }
  }
  for (const custom of state.custom) {
    if (deletedCustom.has(custom.id)) continue;
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
  const existing = loadState();
  const currentIds = new Set(forums.map((f) => f.id));
  return {
    custom: forums.filter((f) => !MOCK_FORUM_IDS.has(f.id)),
    deletedMockIds: MOCK_FORUMS.filter((f) => !currentIds.has(f.id)).map((f) => f.id),
    deletedCustomIds: existing.deletedCustomIds ?? [],
  };
}

export function applyForumsPersistState(state: ForumsState): void {
  if (typeof window === "undefined") return;
  writeJson(STORAGE_KEY, {
    custom: Array.isArray(state.custom) ? state.custom : [],
    deletedMockIds: Array.isArray(state.deletedMockIds) ? state.deletedMockIds : [],
    deletedCustomIds: Array.isArray(state.deletedCustomIds) ? state.deletedCustomIds : [],
  });
  storageLoaded = false;
  forums = [...MOCK_FORUMS];
  ensureLoaded();
  notify();
}

export async function syncForumsToServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { pushForumsPlatformState } = await import("@/lib/content-sync");
  return pushForumsPlatformState(buildForumsPersistState());
}

function persist(): boolean {
  if (typeof window === "undefined") return false;
  const state = buildForumsPersistState();
  const ok = writeJson(STORAGE_KEY, state);
  if (ok) {
    scheduleForumsPlatformPush(state);
  }
  return ok;
}

/** Persist replies/edits to demo forums too (stored as custom overrides). */
function persistForumOverride(forum: RpgForum) {
  if (!MOCK_FORUM_IDS.has(forum.id)) {
    persist();
    void syncForumsToServer();
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
  scheduleForumsPlatformPush(next);
  void syncForumsToServer();
}

function trackDeletedCustomForumId(id: string): void {
  if (MOCK_FORUM_IDS.has(id)) return;
  const state = loadState();
  const deletedCustomIds = [...new Set([...(state.deletedCustomIds ?? []), id])];
  writeJson(STORAGE_KEY, { ...state, deletedCustomIds });
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

function characterIdForAuthor(forum: RpgForum, authorUsername: string): string | null {
  const owner = authorUsername.toLowerCase();
  const character = forum.characters?.find(
    (entry) => entry.owner_username.toLowerCase() === owner
  );
  return character?.id ?? null;
}

function buildForumPost(authorUsername: string, body: string, characterId: string | null): ForumPost {
  return {
    id: `fp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    author_username: authorUsername,
    body: body.trim(),
    created_at: new Date().toISOString(),
    character_id: characterId,
  };
}

export function getUserTopicCharacter(
  forum: RpgForum,
  ownerUsername: string
): TopicCharacter | undefined {
  const owner = ownerUsername.toLowerCase();
  return forum.characters?.find((entry) => entry.owner_username.toLowerCase() === owner);
}

export function getTopicCharacterById(
  forum: RpgForum,
  characterId: string | null | undefined
): TopicCharacter | undefined {
  if (!characterId) return undefined;
  return forum.characters?.find((entry) => entry.id === characterId);
}

export function upsertTopicCharacter(
  forumId: string,
  ownerUsername: string,
  input: { name: string; age?: string | null; linked_post_id?: string | null }
): TopicCharacter | null {
  ensureLoaded();
  const forum = forums.find((entry) => entry.id === forumId);
  if (!forum) return null;
  if (!isForumMember(forum, ownerUsername)) return null;

  const name = input.name.trim();
  if (!name) return null;

  const characters = forum.characters ?? [];
  const owner = ownerUsername.toLowerCase();
  const existing = characters.find((entry) => entry.owner_username.toLowerCase() === owner);
  const age = input.age?.trim() || null;
  const linkedPostId = input.linked_post_id?.trim() || null;

  if (existing) {
    existing.name = name;
    existing.age = age;
    if (linkedPostId) existing.linked_post_id = linkedPostId;
  } else {
    characters.push({
      id: `tc-${Date.now()}`,
      name,
      age,
      owner_username: ownerUsername,
      linked_post_id: linkedPostId,
      created_at: new Date().toISOString(),
    });
  }

  forum.characters = characters;
  saveForumChanges(forum);
  notify();
  return getUserTopicCharacter(forum, ownerUsername) ?? null;
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
  contains_sexual_content?: boolean;
  content_rating?: RpgForum["content_rating"];
  creator_character?: { name: string; age?: string | null };
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

  const characters: TopicCharacter[] = [];
  let creatorCharacterId: string | null = null;
  const creatorCharacterName = input.creator_character?.name?.trim();
  if (creatorCharacterName) {
    creatorCharacterId = `tc-${Date.now()}`;
    characters.push({
      id: creatorCharacterId,
      name: creatorCharacterName,
      age: input.creator_character?.age?.trim() || null,
      owner_username: input.creator_username,
      linked_post_id: null,
      created_at: new Date().toISOString(),
    });
  }

  const openingPosts: ForumPost[] = [];
  if (input.opening_post.trim()) {
    openingPosts.push(
      buildForumPost(
        input.creator_username,
        input.opening_post,
        creatorCharacterId
      )
    );
  }

  const chapter: ForumChapter = {
    number: 1,
    title: normalizePartTitle(1, input.chapter_title),
    meta: input.chapter_meta,
    posts: openingPosts,
  };

  const contains = input.contains_sexual_content ?? false;
  let category = normalizeTopicCategory(input.category);
  if (contains) {
    category = MATURE_TOPIC_CATEGORY;
  } else if (isMatureTopicCategory(category)) {
    throw new Error(
      "The Mature RP category is for topics with declared sexual content (PEGI 18)."
    );
  }
  const forum: RpgForum = normalizeForum({
    id: `f-${Date.now()}`,
    title: input.title.trim(),
    plot_synopsis: input.plot_synopsis?.trim() || null,
    book_cover_url: input.book_cover_url?.trim() || null,
    creator_username: input.creator_username,
    category,
    tags: normalizeTopicTagList(input.tags),
    contains_sexual_content: contains,
    content_rating: resolveContentRating(contains, input.content_rating),
    members,
    is_private: input.is_private,
    is_locked: false,
    locked_at: null,
    shop_post_id: null,
    shop_price_cents: null,
    characters,
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
  void syncForumsToServer();
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

  const openingPost = buildForumPost(
    input.author_username,
    input.opening_post,
    characterIdForAuthor(forum, input.author_username)
  );

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

  const post = buildForumPost(
    authorUsername,
    body,
    characterIdForAuthor(forum, authorUsername)
  );

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
  void syncForumsToServer();
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
    contains_sexual_content: forum.contains_sexual_content,
    content_rating: forum.content_rating,
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
  void import("@/lib/live-content-sync").then(({ scheduleCreationLiveSync }) => {
    scheduleCreationLiveSync(post.id);
  });
  return post.id;
}

export function deleteForum(forumId: string): boolean {
  ensureLoaded();
  const before = forums.length;
  forums = forums.filter((forum) => forum.id !== forumId);
  if (forums.length === before) return false;

  trackDeletedCustomForumId(forumId);
  persist();
  notify();
  void syncForumsToServer();
  return true;
}
