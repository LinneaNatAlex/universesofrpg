import type { PostsPlatformState } from "@/app/api/content/posts/route";
import { migrateFeedPost } from "@/lib/persona-rename";
import { normalizeFreeCodeListing } from "@/lib/moderation";
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

export function sanitizePostForSync(post: FeedPost): FeedPost {
  const migrated = normalizeFreeCodeListing(migrateFeedPost(post));
  return {
    ...migrated,
    description: trimSyncField(migrated.description) ?? migrated.description,
    content: trimSyncField(migrated.content) ?? migrated.content,
    plot_synopsis: trimSyncField(migrated.plot_synopsis) ?? migrated.plot_synopsis,
    template_readme: trimSyncField(migrated.template_readme) ?? migrated.template_readme,
    preview_image_url: trimSyncField(migrated.preview_image_url) ?? migrated.preview_image_url,
    book_cover_url: trimSyncField(migrated.book_cover_url) ?? migrated.book_cover_url,
    preview_html_code: trimSyncField(migrated.preview_html_code) ?? migrated.preview_html_code,
    preview_css_code: trimSyncField(migrated.preview_css_code) ?? migrated.preview_css_code,
    preview_js_code: trimSyncField(migrated.preview_js_code) ?? migrated.preview_js_code,
    html_code: trimSyncField(migrated.html_code) ?? migrated.html_code,
    css_code: trimSyncField(migrated.css_code) ?? migrated.css_code,
    js_code: trimSyncField(migrated.js_code) ?? migrated.js_code,
    bbcode: trimSyncField(migrated.bbcode) ?? migrated.bbcode,
    illustration_images: Array.isArray(migrated.illustration_images)
      ? migrated.illustration_images
          .map((url) => trimSyncField(url))
          .filter((url): url is string => !!url)
      : migrated.illustration_images,
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
