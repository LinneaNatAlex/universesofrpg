import type { FeedPost } from "@/types/database";

export function requiresLoginToViewPost(
  post: Pick<FeedPost, "type">
): boolean {
  return post.type === "code_template";
}

export function canViewPostDetail(
  post: Pick<FeedPost, "type">,
  isLoggedIn: boolean
): boolean {
  if (!requiresLoginToViewPost(post)) return true;
  return isLoggedIn;
}

export function postDetailHref(
  post: Pick<FeedPost, "id" | "type">,
  isLoggedIn: boolean,
  hash?: string
): string {
  const path = `/post/${post.id}${hash ? `#${hash.replace(/^#/, "")}` : ""}`;
  if (requiresLoginToViewPost(post) && !isLoggedIn) {
    return `/login?next=${encodeURIComponent(`/post/${post.id}${hash ? `#${hash.replace(/^#/, "")}` : ""}`)}`;
  }
  return path;
}

export function safeRedirectPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}
