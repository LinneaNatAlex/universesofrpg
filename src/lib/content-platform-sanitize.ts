import type { PostsPlatformState } from "@/app/api/content/posts/route";
import type { FeedPost } from "@/types/database";

/** Keep platform sync under Netlify/Supabase body limits. */
const MAX_INLINE_DATA_URL = 150_000;
const MAX_TEXT_FIELD = 250_000;

function trimSyncField(value: string | null | undefined): string | null | undefined {
  if (value == null) return value;
  if (value.startsWith("data:") && value.length > MAX_INLINE_DATA_URL) {
    return null;
  }
  if (value.length > MAX_TEXT_FIELD) {
    return value.slice(0, MAX_TEXT_FIELD);
  }
  return value;
}

function sanitizePostForSync(post: FeedPost): FeedPost {
  return {
    ...post,
    description: trimSyncField(post.description) ?? post.description,
    content: trimSyncField(post.content) ?? post.content,
    plot_synopsis: trimSyncField(post.plot_synopsis) ?? post.plot_synopsis,
    preview_image_url: trimSyncField(post.preview_image_url) ?? post.preview_image_url,
    book_cover_url: trimSyncField(post.book_cover_url) ?? post.book_cover_url,
    preview_html_code: trimSyncField(post.preview_html_code) ?? post.preview_html_code,
    preview_css_code: trimSyncField(post.preview_css_code) ?? post.preview_css_code,
    preview_js_code: trimSyncField(post.preview_js_code) ?? post.preview_js_code,
    html_code: trimSyncField(post.html_code) ?? post.html_code,
    css_code: trimSyncField(post.css_code) ?? post.css_code,
    js_code: trimSyncField(post.js_code) ?? post.js_code,
    bbcode: trimSyncField(post.bbcode) ?? post.bbcode,
  };
}

export function sanitizePostsPlatformState(state: PostsPlatformState): PostsPlatformState {
  const deletedCustomIds = Array.isArray(state.deletedCustomIds)
    ? state.deletedCustomIds
    : [];
  const deletedCustomSet = new Set(deletedCustomIds);

  return {
    custom: Array.isArray(state.custom)
      ? state.custom
          .filter((post) => !deletedCustomSet.has(post.id))
          .map(sanitizePostForSync)
      : [],
    deletedMockIds: Array.isArray(state.deletedMockIds) ? state.deletedMockIds : [],
    deletedCustomIds,
    likeCounts:
      state.likeCounts && typeof state.likeCounts === "object" ? state.likeCounts : {},
  };
}
