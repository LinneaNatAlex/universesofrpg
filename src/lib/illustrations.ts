import { isValidCoverSource } from "@/lib/post-cover";
import type { FeedPost } from "@/types/database";

export const MAX_ILLUSTRATIONS = 16;

export function normalizeIllustrationImages(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const trimmed = raw.trim();
    if (!trimmed || !isValidCoverSource(trimmed) || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= MAX_ILLUSTRATIONS) break;
  }
  return out;
}

export function getIllustrationImages(post: Pick<FeedPost, "illustration_images" | "preview_image_url">): string[] {
  const fromField = normalizeIllustrationImages(post.illustration_images ?? []);
  if (fromField.length > 0) return fromField;
  const preview = post.preview_image_url?.trim();
  return preview && isValidCoverSource(preview) ? [preview] : [];
}

export function getIllustrationCoverUrl(images: string[]): string | null {
  return images[0] ?? null;
}
