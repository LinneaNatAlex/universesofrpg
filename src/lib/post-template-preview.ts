import { getVaultedCode, type PostCodeBundle } from "@/lib/post-code-vault";
import { normalizeFreeCodeListing } from "@/lib/moderation";
import { stripThemeMusic } from "@/lib/template-preview";
import type { FeedPost } from "@/types/database";

function requiresCodePurchase(post: FeedPost): boolean {
  const listing = normalizeFreeCodeListing(post);
  if (listing.type !== "code_template") return false;
  return listing.pricing !== "free" || listing.is_code_locked;
}

/** Public demo bundle — safe to show before purchase (synced on the post record). */
export function getPublicTemplatePreviewBundle(post: FeedPost): PostCodeBundle | null {
  if (post.type !== "code_template") return null;

  const previewHtml = post.preview_html_code?.trim();
  const previewCss = post.preview_css_code?.trim();
  if (previewHtml && previewCss) {
    return {
      html_code: previewHtml,
      css_code: previewCss,
      js_code: post.preview_js_code ?? null,
    };
  }

  if (!requiresCodePurchase(post)) {
    const html = post.html_code?.trim();
    const css = post.css_code?.trim();
    if (html && css) {
      return {
        html_code: html,
        css_code: css,
        js_code: post.js_code ?? null,
      };
    }
  }

  return null;
}

/** Full or public bundle for the live iframe — includes vault when full source is allowed. */
export function getTemplatePreviewBundleForViewer(
  post: FeedPost,
  fullSourceAllowed: boolean
): PostCodeBundle | null {
  if (fullSourceAllowed) {
    const vaulted = getVaultedCode(post.id);
    if (vaulted) return vaulted;

    const html = post.html_code?.trim();
    const css = post.css_code?.trim();
    if (html && css) {
      return {
        html_code: html,
        css_code: css,
        js_code: post.js_code ?? null,
      };
    }
  }

  return getPublicTemplatePreviewBundle(post);
}

/** Copy inline source into preview_* fields so live demo survives paid-code vaulting + sync. */
export function ensureTemplatePreviewFields(post: FeedPost): FeedPost {
  if (post.type !== "code_template") return post;

  const html =
    post.preview_html_code?.trim() ||
    post.html_code?.trim() ||
    getVaultedCode(post.id)?.html_code?.trim();
  const css =
    post.preview_css_code?.trim() ||
    post.css_code?.trim() ||
    getVaultedCode(post.id)?.css_code?.trim();
  const js =
    post.preview_js_code ??
    post.js_code ??
    getVaultedCode(post.id)?.js_code ??
    null;

  if (!html || !css) return post;

  const cleanHtml = stripThemeMusic(html);

  return {
    ...post,
    preview_html_code: cleanHtml,
    preview_css_code: css,
    preview_js_code: js,
  };
}
