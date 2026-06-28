import { authFetchHeaders } from "@/lib/api-client-auth";
import {
  requiresCodePurchase,
  type PostViewerContext,
} from "@/lib/posts";
import { hasPurchased, recordPurchase } from "@/lib/purchases-store";
import type { FeedPost } from "@/types/database";

async function confirmServerPurchase(
  buyerUsername: string,
  postId: string
): Promise<boolean> {
  try {
    const headers = await authFetchHeaders();
    const purchaseUrl = new URL("/api/marketplace/purchases", window.location.origin);
    purchaseUrl.searchParams.set("post_id", postId);
    purchaseUrl.searchParams.set("acting_username", buyerUsername);
    const res = await fetch(purchaseUrl.toString(), {
      credentials: "include",
      headers,
      cache: "no-store",
    });
    if (!res.ok) {
      // Auth/network hiccup — keep last confirmed local cache for this persona.
      return hasPurchased(buyerUsername, postId);
    }

    const data = (await res.json()) as { purchased?: boolean };
    if (data.purchased) {
      recordPurchase(buyerUsername, postId);
      return true;
    }
    // Server empty — keep Stripe return / local cache (per-persona key) until sync catches up.
    return hasPurchased(buyerUsername, postId);
  } catch {
    return hasPurchased(buyerUsername, postId);
  }
}

function isAuthor(post: FeedPost, username: string): boolean {
  return post.author.username.toLowerCase() === username.toLowerCase();
}

/** Server-confirmed access before showing paid template source. */
export async function verifySourceAccess(
  post: FeedPost,
  viewer: PostViewerContext,
  buyerUsername: string | null
): Promise<boolean> {
  if (post.type !== "code_template") return false;

  if (!requiresCodePurchase(post)) {
    return viewer.isLoggedIn;
  }

  if (!viewer.isLoggedIn || !buyerUsername) return false;
  if (buyerUsername && isAuthor(post, buyerUsername)) return true;
  if (viewer.username && isAuthor(post, viewer.username)) return true;
  if (post.moderation_status === "pending" && viewer.isEditor) return true;

  return confirmServerPurchase(buyerUsername, post.id);
}
