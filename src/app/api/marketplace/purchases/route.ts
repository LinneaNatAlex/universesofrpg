import { NextResponse } from "next/server";
import { resolveBuyerUsername } from "@/lib/api-session-auth";
import {
  hasPlatformPurchase,
  listPlatformPurchasesForBuyer,
} from "@/lib/marketplace-platform-store";

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
  return NextResponse.json({
    username: buyerUsername,
    post_ids: purchases.map((p) => p.post_id),
    purchases,
  });
}
