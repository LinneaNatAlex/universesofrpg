import { readJson, writeJson } from "@/lib/browser-storage";
import { MOCK_FEED } from "@/lib/mock-data";
import { postHasCover } from "@/lib/post-cover";
import {
  removeVaultedCode,
  vaultPostCodeFromPost,
} from "@/lib/post-code-vault";
import type { FeedPost, ModerationStatus } from "@/types/database";

function isPaidCodeTemplate(post: Pick<FeedPost, "type" | "pricing">): boolean {
  return post.type === "code_template" && post.pricing !== "free";
}

/** Keep paid template source in the vault — not on the public post record. */
function stripPaidCodeForStorage(post: FeedPost): FeedPost {
  if (!isPaidCodeTemplate(post)) return post;
  if (!post.html_code?.trim() || !post.css_code?.trim()) return post;

  vaultPostCodeFromPost(post.id, post.html_code, post.css_code, post.js_code);
  return { ...post, html_code: null, css_code: null, js_code: null };
}

const MOCK_POST_IDS = new Set(MOCK_FEED.map((p) => p.id));
const STORAGE_KEY = "uorpg-posts-state";

interface PostsState {
  custom: FeedPost[];
  deletedMockIds: string[];
  /** Persisted like totals for mock posts (custom posts store counts on the post). */
  likeCounts?: Record<string, number>;
}

let posts: FeedPost[] = [...MOCK_FEED];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function sortPosts(list: FeedPost[]): FeedPost[] {
  return [...list].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function loadState(): PostsState {
  const parsed = readJson<PostsState>(STORAGE_KEY, { custom: [], deletedMockIds: [] });
  return {
    custom: Array.isArray(parsed.custom) ? parsed.custom : [],
    deletedMockIds: Array.isArray(parsed.deletedMockIds) ? parsed.deletedMockIds : [],
    likeCounts:
      parsed.likeCounts && typeof parsed.likeCounts === "object" ? parsed.likeCounts : {},
  };
}

function applyLikeCount(post: FeedPost, likeCounts: Record<string, number>): FeedPost {
  const override = likeCounts[post.id];
  if (override === undefined) return post;
  return { ...post, like_count: Math.max(0, override) };
}

function mergePosts() {
  const state = loadState();
  const deleted = new Set(state.deletedMockIds);
  const likeCounts = state.likeCounts ?? {};
  const map = new Map<string, FeedPost>();

  for (const mock of MOCK_FEED) {
    if (!deleted.has(mock.id)) {
      map.set(
        mock.id,
        applyLikeCount(stripPaidCodeForStorage({ ...mock }), likeCounts)
      );
    }
  }

  let customNeedsPersist = false;
  for (const custom of state.custom) {
    const stripped = stripPaidCodeForStorage(custom);
    if (
      stripped.html_code !== custom.html_code ||
      stripped.css_code !== custom.css_code ||
      stripped.js_code !== custom.js_code
    ) {
      customNeedsPersist = true;
    }
    map.set(stripped.id, applyLikeCount(stripped, likeCounts));
  }

  posts = sortPosts([...map.values()]);
  if (customNeedsPersist) {
    persist();
  }
}

function ensureLoaded() {
  if (typeof window === "undefined") return;
  if (storageLoaded) return;
  storageLoaded = true;
  mergePosts();
}

function persist(): boolean {
  if (typeof window === "undefined") return false;
  ensureLoaded();
  const currentIds = new Set(posts.map((p) => p.id));
  const likeCounts: Record<string, number> = {};
  for (const post of posts) {
    if (MOCK_POST_IDS.has(post.id)) {
      const baseline = MOCK_FEED.find((m) => m.id === post.id)?.like_count;
      if (baseline !== undefined && post.like_count !== baseline) {
        likeCounts[post.id] = post.like_count;
      }
    }
  }
  const state: PostsState = {
    custom: posts.filter((p) => !MOCK_POST_IDS.has(p.id)),
    deletedMockIds: MOCK_FEED.filter((p) => !currentIds.has(p.id)).map((p) => p.id),
    likeCounts,
  };
  return writeJson(STORAGE_KEY, state);
}

export function subscribePosts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAllPosts(): FeedPost[] {
  ensureLoaded();
  return [...posts];
}

export function getPostFromStore(id: string): FeedPost | undefined {
  ensureLoaded();
  return posts.find((p) => p.id === id);
}

export function deletePost(id: string): boolean {
  ensureLoaded();
  const before = posts.length;
  posts = posts.filter((p) => p.id !== id);
  if (posts.length < before) {
    removeVaultedCode(id);
    persist();
    notify();
    return true;
  }
  return false;
}

export function setPostModeration(id: string, status: ModerationStatus): boolean {
  ensureLoaded();
  const post = posts.find((p) => p.id === id);
  if (!post) return false;
  post.moderation_status = status;
  persist();
  notify();
  return true;
}

export function adjustLikeCount(id: string, delta: number): boolean {
  ensureLoaded();
  const post = posts.find((p) => p.id === id);
  if (!post) return false;
  post.like_count = Math.max(0, post.like_count + delta);
  persist();
  notify();
  return true;
}

export type NewPostInput = Omit<
  FeedPost,
  "id" | "created_at" | "like_count" | "comment_count"
>;

export function addPost(input: NewPostInput): FeedPost {
  ensureLoaded();
  if (input.pricing !== "free" && !postHasCover(input)) {
    throw new Error("Paid listings require a cover image before they can be published.");
  }
  const id = `post-${Date.now()}`;
  const post: FeedPost = stripPaidCodeForStorage({
    ...input,
    id,
    created_at: new Date().toISOString(),
    like_count: 0,
    comment_count: 0,
  });
  posts = [post, ...posts];
  if (!persist()) {
    posts = posts.filter((p) => p.id !== post.id);
    throw new Error(
      "Could not save your post in this browser. Try a smaller cover image or paste an image URL instead of uploading a large file."
    );
  }
  notify();
  return post;
}
