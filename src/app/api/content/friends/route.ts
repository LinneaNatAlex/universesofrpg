import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import { sanitizeFriendsPlatformState } from "@/lib/social-platform-sanitize";
import {
  getPlatformContent,
  setPlatformContent,
} from "@/lib/content-platform-store";
import type { FriendLink } from "@/types/database";

export interface FriendsPlatformState {
  byOwner: Record<string, FriendLink[]>;
}

const EMPTY: FriendsPlatformState = { byOwner: {} };

export async function GET() {
  const state = await getPlatformContent<FriendsPlatformState>("friends", EMPTY);
  const byOwner =
    state.byOwner && typeof state.byOwner === "object" ? state.byOwner : {};
  return NextResponse.json({ byOwner });
}

export async function PUT(request: Request) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: FriendsPlatformState;
    try {
      body = (await request.json()) as FriendsPlatformState;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const state = sanitizeFriendsPlatformState({
      byOwner:
        body.byOwner && typeof body.byOwner === "object" ? body.byOwner : {},
    });

    const result = await setPlatformContent("friends", state);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      owners: Object.keys(state.byOwner).length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
