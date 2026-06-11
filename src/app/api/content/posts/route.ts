import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import {
  getPlatformContent,
  setPlatformContent,
} from "@/lib/content-platform-store";
import type { FeedPost } from "@/types/database";

export interface PostsPlatformState {
  custom: FeedPost[];
  deletedMockIds: string[];
  likeCounts?: Record<string, number>;
}

const EMPTY: PostsPlatformState = {
  custom: [],
  deletedMockIds: [],
  likeCounts: {},
};

export async function GET() {
  const state = await getPlatformContent<PostsPlatformState>("posts", EMPTY);
  return NextResponse.json({
    custom: Array.isArray(state.custom) ? state.custom : [],
    deletedMockIds: Array.isArray(state.deletedMockIds) ? state.deletedMockIds : [],
    likeCounts:
      state.likeCounts && typeof state.likeCounts === "object" ? state.likeCounts : {},
  });
}

export async function PUT(request: Request) {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: PostsPlatformState;
  try {
    body = (await request.json()) as PostsPlatformState;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const state: PostsPlatformState = {
    custom: Array.isArray(body.custom) ? body.custom : [],
    deletedMockIds: Array.isArray(body.deletedMockIds) ? body.deletedMockIds : [],
    likeCounts:
      body.likeCounts && typeof body.likeCounts === "object" ? body.likeCounts : {},
  };

  const result = await setPlatformContent("posts", state);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: state.custom.length });
}
