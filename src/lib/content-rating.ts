import { ADULT_PURCHASE_AGE } from "@/lib/account-age";
import type { FeedPost } from "@/types/database";

/** PEGI-style content ratings used on Universes of RPG. */
export type ContentRating = "everyone" | "peg12" | "peg16" | "peg18";

/** Sexual / explicit content follows PEGI 18 — adults only. */
export const PEGI_SEXUAL_MIN_AGE = ADULT_PURCHASE_AGE;

export const SEXUAL_CONTENT_TAG = "sexual-content";

export interface RatableContentFields {
  contains_sexual_content?: boolean;
  content_rating?: ContentRating;
}

export interface ContentViewerContext {
  isLoggedIn: boolean;
  userAge: number | null;
  username?: string | null;
  isEditor?: boolean;
}

export function hasSexualContent(
  item: RatableContentFields | null | undefined
): boolean {
  if (!item) return false;
  return item.contains_sexual_content === true || item.content_rating === "peg18";
}

export function resolveContentRating(
  containsSexual: boolean,
  rating?: ContentRating | null
): ContentRating {
  if (containsSexual) return "peg18";
  return rating ?? "everyone";
}

export function applySexualContentTags(tags: string[], containsSexual: boolean): string[] {
  const normalized = [...tags];
  const hasTag = normalized.some(
    (t) => t.toLowerCase() === SEXUAL_CONTENT_TAG
  );
  if (containsSexual && !hasTag) {
    normalized.push(SEXUAL_CONTENT_TAG);
  }
  if (!containsSexual) {
    return normalized.filter((t) => t.toLowerCase() !== SEXUAL_CONTENT_TAG);
  }
  return normalized;
}

export function contentRatingLabel(rating: ContentRating | undefined): string {
  switch (rating ?? "everyone") {
    case "peg18":
      return "PEGI 18";
    case "peg16":
      return "PEGI 16";
    case "peg12":
      return "PEGI 12";
    default:
      return "PEGI 3";
  }
}

function isAuthorUsername(
  authorUsername: string | undefined,
  viewerUsername: string | null | undefined
): boolean {
  if (!authorUsername || !viewerUsername) return false;
  return authorUsername.toLowerCase() === viewerUsername.toLowerCase();
}

export function isPostAuthor(
  post: Pick<FeedPost, "author">,
  viewerUsername: string | null | undefined
): boolean {
  return isAuthorUsername(post.author.username, viewerUsername);
}

/** Browse/create mature RPG topics — same age gate as sexual content. */
export function canAccessMatureCatalog(ctx: ContentViewerContext): boolean {
  if (ctx.isEditor) return true;
  if (!ctx.isLoggedIn || ctx.userAge == null) return false;
  return ctx.userAge >= PEGI_SEXUAL_MIN_AGE;
}

/** Catalog surfaces (feed, explore, shop cards, discussion list). */
export function isVisibleInPublicCatalog(
  item: RatableContentFields & { author_username?: string; author?: { username: string } },
  ctx: ContentViewerContext
): boolean {
  if (!hasSexualContent(item)) return true;
  if (ctx.isEditor) return true;
  const author =
    item.author?.username ?? item.author_username ?? null;
  if (isAuthorUsername(author ?? undefined, ctx.username)) return true;
  if (!ctx.isLoggedIn || ctx.userAge == null) return false;
  return ctx.userAge >= PEGI_SEXUAL_MIN_AGE;
}

/** Full read access to a rated creation. */
export function canViewRatedContent(
  item: RatableContentFields & { author_username?: string; author?: { username: string } },
  ctx: ContentViewerContext
): boolean {
  if (!hasSexualContent(item)) return true;
  if (ctx.isEditor) return true;
  const author =
    item.author?.username ?? item.author_username ?? null;
  if (isAuthorUsername(author ?? undefined, ctx.username)) return true;
  if (!ctx.isLoggedIn || ctx.userAge == null) return false;
  return ctx.userAge >= PEGI_SEXUAL_MIN_AGE;
}

export function buildRatableContentFields(
  containsSexual: boolean,
  options?: { rating?: ContentRating | null; tags?: string[] }
): {
  contains_sexual_content: boolean;
  content_rating: ContentRating;
  tags?: string[];
} {
  const contains = containsSexual === true;
  const fields = {
    contains_sexual_content: contains,
    content_rating: resolveContentRating(contains, options?.rating),
  };
  if (options?.tags) {
    return { ...fields, tags: applySexualContentTags(options.tags, contains) };
  }
  return fields;
}

export function buildContentViewerContext(input: {
  isLoggedIn: boolean;
  userAge: number | null;
  username?: string | null;
  isEditor?: boolean;
}): ContentViewerContext {
  return {
    isLoggedIn: input.isLoggedIn,
    userAge: input.userAge,
    username: input.username ?? null,
    isEditor: input.isEditor ?? false,
  };
}
