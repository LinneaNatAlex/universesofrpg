import { NextResponse } from "next/server";
import {
  countPlatformPurchasesForPost,
  countPlatformPurchasesForPosts,
} from "@/lib/marketplace-platform-store";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const postId = params.get("post_id")?.trim();
  const postIds = params
    .get("post_ids")
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (postId) {
    const count = await countPlatformPurchasesForPost(postId);
    return NextResponse.json({ post_id: postId, count });
  }

  if (postIds && postIds.length > 0) {
    const counts = await countPlatformPurchasesForPosts(postIds);
    return NextResponse.json({ counts });
  }

  return NextResponse.json(
    { error: "Provide post_id or post_ids query parameter." },
    { status: 400 }
  );
}
