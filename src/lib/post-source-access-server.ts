import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin";
import { hasPlatformPurchase } from "@/lib/marketplace-platform-store";
import { getPersonaByUsername } from "@/lib/personas";
import type { SessionUser } from "@/lib/api-session-auth";
import type { FeedPost } from "@/types/database";

function requiresCodePurchase(post: FeedPost): boolean {
  if (post.type !== "code_template") return false;
  return post.pricing !== "free" || post.is_code_locked;
}

export async function canAccessPostSourceCode(
  post: FeedPost,
  user: SessionUser,
  isEditor = false
): Promise<boolean> {
  if (post.type !== "code_template") return false;

  if (!requiresCodePurchase(post)) return true;
  if (post.moderation_status === "pending" && isEditor) return true;
  if (user.username.toLowerCase() === post.author.username.toLowerCase()) {
    return true;
  }

  return hasPlatformPurchase(user.username, post.id);
}

export async function canManagePostSourceCode(
  post: FeedPost,
  user: SessionUser
): Promise<boolean> {
  if (user.username.toLowerCase() === post.author.username.toLowerCase()) {
    return true;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (
      authUser &&
      isAdminUser(authUser) &&
      getPersonaByUsername(post.author.username)
    ) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}
