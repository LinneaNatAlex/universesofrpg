import { readJson, writeJson } from "@/lib/browser-storage";
import { schedulePostsPlatformPush } from "@/lib/content-sync";
import { MOCK_FEED } from "@/lib/mock-data";
import { postHasCover } from "@/lib/post-cover";
import {
  getVaultedCode,
  removeVaultedCode,
  vaultPostCodeFromPost,
} from "@/lib/post-code-vault";
import { ensureTemplatePreviewFields } from "@/lib/post-template-preview";
import {
  codeLockOnPricingChange,
  enforceListingRules,
  moderationStatusOnPricingChange,
  normalizeFreeCodeListing,
} from "@/lib/moderation";
import type { FeedPost, ModerationStatus } from "@/types/database";

function isPaidCodeTemplate(post: Pick<FeedPost, "type" | "pricing">): boolean {
  return post.type === "code_template" && post.pricing !== "free";
}

/** Keep paid template source in the vault — public preview_* fields stay for live demo. */
function stripPaidCodeForStorage(post: FeedPost): FeedPost {
  const withPreview = ensureTemplatePreviewFields(post);
  if (!isPaidCodeTemplate(withPreview)) return withPreview;
  if (!withPreview.html_code?.trim() || !withPreview.css_code?.trim()) {
    return withPreview;
  }

  vaultPostCodeFromPost(
    withPreview.id,
    withPreview.html_code,
    withPreview.css_code,
    withPreview.js_code
  );
  return {
    ...withPreview,
    html_code: null,
    css_code: null,
    js_code: null,
  };
}

/** When a paid template becomes free, restore vaulted source onto the public post. */
function restoreFreeCodeFromVault(post: FeedPost): FeedPost {
  if (post.type !== "code_template" || post.pricing !== "free") return post;

  const vaulted = getVaultedCode(post.id);
  const html = post.html_code?.trim() || vaulted?.html_code?.trim();
  const css = post.css_code?.trim() || vaulted?.css_code?.trim();
  if (!html || !css) return post;

  const restored = ensureTemplatePreviewFields({
    ...post,
    html_code: html,
    css_code: css,
    js_code: post.js_code?.trim() ? post.js_code : (vaulted?.js_code ?? null),
  });

  removeVaultedCode(post.id);
  return restored;
}

function applyPricingChangePatches(
  existing: FeedPost,
  input: UpdatePostInput
): Partial<FeedPost> {
  if (input.pricing === undefined || input.pricing === existing.pricing) {
    return {};
  }

  const patches: Partial<FeedPost> = {
    moderation_status: moderationStatusOnPricingChange(
      existing.moderation_status,
      existing.pricing,
      input.pricing
    ),
  };

  if (existing.type === "code_template") {
    patches.is_code_locked = codeLockOnPricingChange(
      existing.pricing,
      input.pricing,
      existing.is_code_locked,
      input.is_code_locked
    );
    if (input.pricing === "free") {
      patches.price_cents = 0;
    }
  }

  return patches;
}

const MOCK_POST_IDS = new Set(MOCK_FEED.map((p) => p.id));
const STORAGE_KEY = "uorpg-posts-state";

export interface PostsState {
  custom: FeedPost[];
  deletedMockIds: string[];
  /** Tombstones for user-created posts removed by admin/creator. */
  deletedCustomIds?: string[];
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
  const parsed = readJson<PostsState>(STORAGE_KEY, {
    custom: [],
    deletedMockIds: [],
    deletedCustomIds: [],
  });
  return {
    custom: Array.isArray(parsed.custom) ? parsed.custom : [],
    deletedMockIds: Array.isArray(parsed.deletedMockIds) ? parsed.deletedMockIds : [],
    deletedCustomIds: Array.isArray(parsed.deletedCustomIds) ? parsed.deletedCustomIds : [],
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
  const deletedCustom = new Set(state.deletedCustomIds ?? []);
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
    if (deletedCustom.has(custom.id)) continue;
    const stripped = stripPaidCodeForStorage(ensureTemplatePreviewFields(custom));
    if (
      stripped.html_code !== custom.html_code ||
      stripped.css_code !== custom.css_code ||
      stripped.js_code !== custom.js_code
    ) {
      customNeedsPersist = true;
    }
    map.set(stripped.id, applyLikeCount(normalizeFreeCodeListing(stripped), likeCounts));
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

export function buildPostsPersistState(): PostsState {
  ensureLoaded();
  const existing = loadState();
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
  return {
    custom: posts.filter((p) => !MOCK_POST_IDS.has(p.id)),
    deletedMockIds: MOCK_FEED.filter((p) => !currentIds.has(p.id)).map((p) => p.id),
    deletedCustomIds: existing.deletedCustomIds ?? [],
    likeCounts,
  };
}

export function applyPostsPersistState(state: PostsState): void {
  if (typeof window === "undefined") return;
  writeJson(STORAGE_KEY, {
    custom: Array.isArray(state.custom) ? state.custom : [],
    deletedMockIds: Array.isArray(state.deletedMockIds) ? state.deletedMockIds : [],
    deletedCustomIds: Array.isArray(state.deletedCustomIds) ? state.deletedCustomIds : [],
    likeCounts:
      state.likeCounts && typeof state.likeCounts === "object" ? state.likeCounts : {},
  });
  storageLoaded = false;
  posts = [...MOCK_FEED];
  ensureLoaded();
  notify();
}

export async function syncPostsToServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const {
    fetchPostsPlatformState,
    mergePostsState,
    pushPostsPlatformState,
  } = await import("@/lib/content-sync");
  const remote = await fetchPostsPlatformState();
  if (remote) {
    applyPostsPersistState(mergePostsState(buildPostsPersistState(), remote));
  }
  return pushPostsPlatformState(buildPostsPersistState());
}

function persist(): boolean {
  if (typeof window === "undefined") return false;
  const state = buildPostsPersistState();
  const ok = writeJson(STORAGE_KEY, state);
  if (ok) {
    schedulePostsPlatformPush(state);
  }
  return ok;
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

function trackDeletedCustomPostId(id: string): void {
  if (MOCK_POST_IDS.has(id)) return;
  const state = loadState();
  const deletedCustomIds = [
    ...new Set([...(state.deletedCustomIds ?? []), id]),
  ];
  writeJson(STORAGE_KEY, { ...state, deletedCustomIds });
}

export function deletePost(id: string): boolean {
  ensureLoaded();
  const before = posts.length;
  posts = posts.filter((p) => p.id !== id);
  if (posts.length < before) {
    trackDeletedCustomPostId(id);
    removeVaultedCode(id);
    persist();
    notify();
    void syncPostsToServer();
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
  void syncPostsToServer();
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
  const now = new Date().toISOString();
  const id = `post-${Date.now()}`;
  const post: FeedPost = stripPaidCodeForStorage({
    ...input,
    id,
    created_at: now,
    updated_at: now,
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
  void syncPostsToServer();
  return post;
}

export type UpdatePostInput = Partial<NewPostInput>;

export function updatePost(id: string, input: UpdatePostInput): FeedPost {
  ensureLoaded();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Post not found.");

  const existing = posts[idx];
  const pricingPatches = applyPricingChangePatches(existing, input);
  const merged: FeedPost = {
    ...existing,
    ...input,
    ...pricingPatches,
    id: existing.id,
    created_at: existing.created_at,
    like_count: existing.like_count,
    comment_count: existing.comment_count,
    author_id: existing.author_id,
    author: input.author ?? existing.author,
  };

  const withCode = normalizeFreeCodeListing(
    restoreFreeCodeFromVault(enforceListingRules(merged, existing.pricing))
  );

  if (withCode.pricing !== "free" && !postHasCover(withCode)) {
    throw new Error("Paid listings require a cover image before they can be saved.");
  }

  const updated = stripPaidCodeForStorage({
    ...withCode,
    updated_at: new Date().toISOString(),
  });
  posts[idx] = updated;
  posts = sortPosts(posts);
  if (!persist()) {
    throw new Error(
      "Could not save your changes in this browser. Try a smaller cover image or paste an image URL instead of uploading a large file."
    );
  }
  notify();
  void syncPostsToServer();
  return updated;
}
