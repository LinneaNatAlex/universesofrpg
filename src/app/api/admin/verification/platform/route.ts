import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/api-admin-auth";
import {
  listPlatformRevokedUsernames,
  listPlatformSubscriptions,
} from "@/lib/verification-platform-store";

export async function GET() {
  const auth = await requireAdminApiUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [revoked, subscriptions] = await Promise.all([
    listPlatformRevokedUsernames(),
    listPlatformSubscriptions(),
  ]);

  return NextResponse.json({ revoked, subscriptions });
}
