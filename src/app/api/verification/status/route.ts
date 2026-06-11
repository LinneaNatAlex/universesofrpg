import { NextResponse } from "next/server";
import { DEMO_PERSONAS } from "@/lib/personas";
import {
  getPlatformSubscription,
  isUsernameRevokedOnPlatform,
} from "@/lib/verification-platform-store";

function isSeededVerified(username: string): boolean {
  const key = username.toLowerCase();
  return DEMO_PERSONAS.some(
    (p) => p.username.toLowerCase() === key && p.is_verified_creator
  );
}

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const revoked = await isUsernameRevokedOnPlatform(username);
  const subscription = await getPlatformSubscription(username);
  const subscriptionActive =
    subscription?.status === "active" &&
    !!subscription.current_period_end &&
    new Date(subscription.current_period_end).getTime() > Date.now();

  const seeded = isSeededVerified(username);
  const showsVerified = !revoked && (seeded || subscriptionActive);

  return NextResponse.json({
    username,
    revoked,
    seeded,
    subscription,
    subscriptionActive,
    showsVerified,
  });
}
