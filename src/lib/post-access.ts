import type { FeedPost } from "@/types/database";

/** All listings require sign-in to open the post page (teasers stay on feed/explore only). */
export function requiresLoginToViewPost(
  _post?: Pick<FeedPost, "type">
): boolean {
  return true;
}

export function canViewPostDetail(
  post: Pick<FeedPost, "invite_token">,
  isLoggedIn: boolean,
  inviteToken?: string | null
): boolean {
  if (isLoggedIn) return true;
  if (inviteToken && post.invite_token && inviteToken === post.invite_token) {
    return true;
  }
  return false;
}

export function postDetailHref(
  post: Pick<FeedPost, "id">,
  isLoggedIn: boolean,
  hash?: string
): string {
  const path = `/post/${post.id}${hash ? `#${hash.replace(/^#/, "")}` : ""}`;
  if (!isLoggedIn) {
    return `/login?next=${encodeURIComponent(path)}`;
  }
  return path;
}

export function safeRedirectPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}
