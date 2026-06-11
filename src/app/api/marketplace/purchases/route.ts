import { NextResponse } from "next/server";
import { resolveBuyerUsername } from "@/lib/api-session-auth";
import {
  hasPlatformPurchase,
  listPlatformPurchasesForBuyer,
  type PlatformPurchase,
} from "@/lib/marketplace-platform-store";
import { resolvePlatformPostById } from "@/lib/resolve-platform-post";
import type { FeedPost } from "@/types/database";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const postId = params.get("post_id")?.trim();

  const actingUsername = params.get("acting_username");
  const buyerAuth = await resolveBuyerUsername(actingUsername, request);
  if (!buyerAuth.ok) {
    return NextResponse.json({ error: buyerAuth.error }, { status: buyerAuth.status });
  }

  const { buyerUsername } = buyerAuth;

  if (postId) {
    const purchased = await hasPlatformPurchase(buyerUsername, postId);
    return NextResponse.json({
      username: buyerUsername,
      post_id: postId,
      purchased,
    });
  }

  const purchases = await listPlatformPurchasesForBuyer(buyerUsername);
  const posts = await enrichPurchasedPosts(purchases);

  return NextResponse.json({
    username: buyerUsername,
    post_ids: purchases.map((p) => p.post_id),
    purchases,
    posts,
  });
}

async function enrichPurchasedPosts(purchases: PlatformPurchase[]): Promise<FeedPost[]> {
  const posts: FeedPost[] = [];
  const seen = new Set<string>();

  for (const purchase of purchases) {
    if (seen.has(purchase.post_id)) continue;
    const post = await resolvePlatformPostById(purchase.post_id);
    if (post) {
      seen.add(purchase.post_id);
      posts.push(post);
    }
  }

  return posts;
}
