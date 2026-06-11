import { getCommentCount } from "@/lib/mock-comments";
import { getVaultedCode } from "@/lib/post-code-vault";
import {
  getPublicTemplatePreviewBundle,
  getTemplatePreviewBundleForViewer,
} from "@/lib/post-template-preview";
import { hasPurchased } from "@/lib/purchases-store";
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

export function canEditPost(post: FeedPost, username: string | null): boolean {
  if (!username) return false;
  return post.author.username.toLowerCase() === username.toLowerCase();
}

export function getFeedPosts(): FeedPost[] {
  return getAllPosts()
    .filter((p) => p.moderation_status === "approved")
    .map(withCommentCount);
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

/** Paid code templates always lock source; free templates may opt in via is_code_locked. */
export function requiresCodePurchase(post: FeedPost): boolean {
  if (post.type !== "code_template") return false;
  return post.pricing !== "free" || post.is_code_locked;
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

  const vaulted = getVaultedCode(post.id);
  const hasInline =
    !!(post.html_code?.trim() || post.css_code?.trim() || post.js_code?.trim());
  if (!hasInline && !vaulted) return false;

  if (!opts.isLoggedIn) return false;

  // Free templates — full source for signed-in members (no purchase).
  if (!requiresCodePurchase(post)) {
    return true;
  }

  if (post.moderation_status === "pending" && opts.isEditor) return true;
  if (!opts.username) return false;
  if (isAuthor(post, opts.username)) return true;
  return hasPurchased(opts.username, post.id);
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
