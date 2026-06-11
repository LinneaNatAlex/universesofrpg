import { readJson, writeJson } from "@/lib/browser-storage";

const STORAGE_KEY = "uorpg-topic-bookmarks";

export interface TopicReadingBookmark {
  username: string;
  forum_id: string;
  chapter_index: number;
  page_index: number;
  updated_at: string;
}

let bookmarks: TopicReadingBookmark[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function load() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  bookmarks = readJson<TopicReadingBookmark[]>(STORAGE_KEY, []);
}

function ensureLoaded() {
  load();
}

function persist() {
  writeJson(STORAGE_KEY, bookmarks);
}

function userKey(username: string) {
  return username.toLowerCase();
}

function bookmarkKey(forumId: string, chapterIndex: number) {
  return `${forumId}:${chapterIndex}`;
}

export function subscribeTopicBookmarks(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTopicBookmark(
  username: string,
  forumId: string,
  chapterIndex: number
): TopicReadingBookmark | undefined {
  ensureLoaded();
  const user = userKey(username);
  const key = bookmarkKey(forumId, chapterIndex);
  return bookmarks.find(
    (b) =>
      userKey(b.username) === user &&
      bookmarkKey(b.forum_id, b.chapter_index) === key
  );
}

export function setTopicBookmark(
  username: string,
  forumId: string,
  chapterIndex: number,
  pageIndex: number
): void {
  ensureLoaded();
  const user = userKey(username);
  const key = bookmarkKey(forumId, chapterIndex);
  const next: TopicReadingBookmark = {
    username: user,
    forum_id: forumId,
    chapter_index: chapterIndex,
    page_index: pageIndex,
    updated_at: new Date().toISOString(),
  };

  bookmarks = [
    next,
    ...bookmarks.filter(
      (b) =>
        !(
          userKey(b.username) === user &&
          bookmarkKey(b.forum_id, b.chapter_index) === key
        )
    ),
  ];
  persist();
  notify();
}

export function clearTopicBookmark(
  username: string,
  forumId: string,
  chapterIndex: number
): void {
  ensureLoaded();
  const user = userKey(username);
  const key = bookmarkKey(forumId, chapterIndex);
  const before = bookmarks.length;
  bookmarks = bookmarks.filter(
    (b) =>
      !(
        userKey(b.username) === user &&
        bookmarkKey(b.forum_id, b.chapter_index) === key
      )
  );
  if (bookmarks.length < before) {
    persist();
    notify();
  }
}
