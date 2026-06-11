import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import {
  getProfileAvatarFromDb,
  isAcceptableAvatarUrl,
  saveProfileAvatar,
} from "@/lib/profile-avatar-server";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const avatar_url = await getProfileAvatarFromDb(username);
  return NextResponse.json({
    username: username.toLowerCase(),
    avatar_url,
  });
}

export async function PUT(request: Request) {
  const auth = await requireSessionUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { avatar_url?: string | null; for_username?: string | null };
  try {
    body = (await request.json()) as {
      avatar_url?: string | null;
      for_username?: string | null;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const avatarUrl =
    body.avatar_url === null || body.avatar_url === undefined
      ? null
      : String(body.avatar_url).trim();

  if (avatarUrl !== null && !isAcceptableAvatarUrl(avatarUrl)) {
    return NextResponse.json(
      { error: "Invalid or too large image. Use JPG, PNG, WebP, or GIF under ~900KB." },
      { status: 400 }
    );
  }

  const result = await saveProfileAvatar(
    auth.user.id,
    auth.user.username,
    avatarUrl,
    body.for_username
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    username: result.username,
    avatar_url: avatarUrl,
    saved: true,
  });
}

