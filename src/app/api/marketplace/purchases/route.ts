import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import {
  hasPlatformPurchase,
  listPlatformPurchasesForBuyer,
} from "@/lib/marketplace-platform-store";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const postId = params.get("post_id")?.trim();

  const auth = await requireSessionUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (postId) {
    const purchased = await hasPlatformPurchase(auth.user.username, postId);
    return NextResponse.json({
      username: auth.user.username,
      post_id: postId,
      purchased,
    });
  }

  const purchases = await listPlatformPurchasesForBuyer(auth.user.username);
  return NextResponse.json({
    username: auth.user.username,
    post_ids: purchases.map((p) => p.post_id),
    purchases,
  });
}
