import {
  canViewRatedContent,
  type ContentViewerContext,
} from "@/lib/content-rating";
import { isPublicFeedPost, normalizeFreeCodeListing } from "@/lib/moderation";
import { getCommentCount } from "@/lib/mock-comments";
import { getVaultedCode, type PostCodeBundle } from "@/lib/post-code-vault";
import {
  getPublicTemplatePreviewBundle,
  getTemplatePreviewBundleForViewer,
} from "@/lib/post-template-preview";
import { getPostFromStore, getAllPosts } from "@/lib/posts-store";
import type { FeedPost } from "@/types/database";

function withCommentCount(post: FeedPost): FeedPost {
  return { ...post, comment_count: getCommentCount(post.id) };
}

export interface PostViewerContext {
  isLoggedIn: boolean;
  username: string | null;
  inviteToken?: string | null;
  isEditor?: boolean;
}

export function getPostById(id: string): FeedPost | undefined {
  const post = getPostFromStore(id);
  return post ? withCommentCount(post) : undefined;
}

/** Full source for the edit studio — vault, then preview fields, then inline code. */
export function getPostForEditing(id: string): FeedPost | undefined {
  const post = getPostById(id);
  if (!post) return undefined;

  const merged = mergeVaultedCode(post);
  return {
    ...merged,
    html_code: merged.html_code ?? merged.preview_html_code ?? null,
    css_code: merged.css_code ?? merged.preview_css_code ?? null,
    js_code: merged.js_code ?? merged.preview_js_code ?? null,
  };
}

/** Full source from this browser — vault + inline fields, no network wait. */
export function getLocalTemplateCodeBundle(id: string): PostCodeBundle | null {
  const post = getPostForEditing(id);
  if (!post || post.type !== "code_template") return null;

  const html = post.html_code?.trim();
  const css = post.css_code?.trim();
  if (!html || !css) return null;

  return {
    html_code: html,
    css_code: css,
    js_code: post.js_code ?? null,
  };
}

export function canEditPost(post: FeedPost, username: string | null): boolean {
  if (!username) return false;
  return post.author.username.toLowerCase() === username.toLowerCase();
}

export function getFeedPosts(): FeedPost[] {
  return getAllPosts().filter(isPublicFeedPost).map(withCommentCount);
}

export function getFreePosts(): FeedPost[] {
  return getFeedPosts().filter((p) => p.pricing === "free");
}

export function canViewFullContent(
  isLoggedIn: boolean,
  inviteToken?: string | null,
  postInviteToken?: string | null
): boolean {
  if (isLoggedIn) return true;
  if (inviteToken && postInviteToken && inviteToken === postInviteToken) return true;
  return false;
}

/** Login/invite plus PEGI age rules for sexual creations. */
export function canViewPostFullContent(
  post: FeedPost,
  isLoggedIn: boolean,
  inviteToken: string | null | undefined,
  ratingCtx: ContentViewerContext
): boolean {
  if (!canViewFullContent(isLoggedIn, inviteToken, post.invite_token)) return false;
  return canViewRatedContent(post, ratingCtx);
}

/** Paid code templates always lock source; free templates may opt in via is_code_locked. */
export function requiresCodePurchase(post: FeedPost): boolean {
  if (post.type !== "code_template") return false;
  const listing = normalizeFreeCodeListing(post);
  return listing.pricing !== "free" || listing.is_code_locked;
}

function isAuthor(post: FeedPost, username: string | null): boolean {
  if (!username) return false;
  return post.author.username.toLowerCase() === username.toLowerCase();
}

function mergeVaultedCode(post: FeedPost): FeedPost {
  const vaulted = getVaultedCode(post.id);
  if (!vaulted) return post;
  return {
    ...post,
    html_code: vaulted.html_code,
    css_code: vaulted.css_code,
    js_code: vaulted.js_code,
  };
}

export function canViewCodeSource(
  post: FeedPost,
  opts: PostViewerContext
): boolean {
  if (post.type !== "code_template") return false;
  if (!opts.isLoggedIn) return false;

  const listing = normalizeFreeCodeListing(post);
  if (!requiresCodePurchase(listing)) {
    return true;
  }

  if (post.moderation_status === "pending" && opts.isEditor) return true;
  if (!opts.username) return false;
  if (isAuthor(post, opts.username)) return true;
  // Buyers unlock paid source via server-confirmed purchase (see CodeSourcePanel).
  return false;
}

/** Live iframe preview — public demo bundle or unlocked full source. */
export function canViewCodeLivePreview(
  post: FeedPost,
  opts: PostViewerContext
): boolean {
  if (post.type !== "code_template") return false;
  return (
    getTemplatePreviewBundleForViewer(post, canViewCodeSource(post, opts)) !== null
  );
}

export function getCodeTemplatePreviewBundle(
  post: FeedPost,
  opts: PostViewerContext
) {
  return getTemplatePreviewBundleForViewer(
    post,
    canViewCodeSource(post, opts)
  );
}

/** Attach vaulted source when the viewer is allowed to see it. */
export function resolvePostForViewer(
  post: FeedPost,
  opts: PostViewerContext
): FeedPost {
  if (!canViewCodeSource(post, opts)) return post;
  return mergeVaultedCode(post);
}

export function canViewCodePreview(post: FeedPost): boolean {
  if (post.type !== "code_template") return false;
  if (getPublicTemplatePreviewBundle(post)) return true;
  if (requiresCodePurchase(post)) {
    return !!post.preview_image_url?.trim();
  }
  const withCode = mergeVaultedCode(post);
  return !!(withCode.html_code && withCode.css_code);
}
