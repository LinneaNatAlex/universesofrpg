import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import { sanitizeFriendRequestsState } from "@/lib/social-platform-sanitize";
import {
  getPlatformContent,
  setPlatformContent,
} from "@/lib/content-platform-store";
import type { FriendRequest } from "@/types/database";

export interface FriendRequestsPlatformState {
  requests: FriendRequest[];
}

const EMPTY: FriendRequestsPlatformState = { requests: [] };

export async function GET() {
  const state = await getPlatformContent<FriendRequestsPlatformState>(
    "friend_requests",
    EMPTY
  );
  return NextResponse.json({
    requests: Array.isArray(state.requests) ? state.requests : [],
  });
}

export async function PUT(request: Request) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: FriendRequestsPlatformState;
    try {
      body = (await request.json()) as FriendRequestsPlatformState;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const state = sanitizeFriendRequestsState({
      requests: Array.isArray(body.requests) ? body.requests : [],
    });

    const result = await setPlatformContent("friend_requests", state);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: state.requests.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
