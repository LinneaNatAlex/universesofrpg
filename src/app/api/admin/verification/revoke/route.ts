import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/api-admin-auth";
import { adminRevokeOnPlatform } from "@/lib/verification-platform-store";

export async function POST(request: Request) {
  const auth = await requireAdminApiUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username = body.username?.trim().toLowerCase().replace(/^@/, "");
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  try {
    await adminRevokeOnPlatform(username, auth.user.email ?? "admin");
    return NextResponse.json({ ok: true, username });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not revoke verified access";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
