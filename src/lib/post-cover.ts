import { getPublicTemplatePreviewBundle } from "@/lib/post-template-preview";
import type { FeedPost } from "@/types/database";

/** Cover image URL for list cards — preview_image for code/assets, book_cover for stories. */
export function getPostCoverImage(post: FeedPost): string | null {
  const preview = post.preview_image_url?.trim();
  const book = post.book_cover_url?.trim();

  if (post.type === "code_template" || post.type === "digital_asset") {
    return preview || null;
  }

  if (
    post.type === "story_segment" ||
    post.type === "text_writing" ||
    post.type === "character_sheet" ||
    post.type === "collab_thread"
  ) {
    return book || preview || null;
  }

  return preview || book || null;
}

export function postHasLiveCodeThumb(post: FeedPost): boolean {
  if (post.type !== "code_template") return false;
  return getPublicTemplatePreviewBundle(post) !== null;
}

export function postHasCover(
  post: Pick<FeedPost, "type" | "preview_image_url" | "book_cover_url">
): boolean {
  return !!getPostCoverImage(post as FeedPost);
}

export function isValidCoverUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** HTTP(S) URL or base64 data URL from a local upload. */
export function isValidCoverSource(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("data:image/")) {
    return /^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(trimmed);
  }
  return isValidCoverUrl(trimmed);
}
