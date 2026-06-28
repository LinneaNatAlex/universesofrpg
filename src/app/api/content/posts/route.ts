import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import { jsonLiveContent } from "@/lib/api-live-json";
import { sanitizePostsPlatformState } from "@/lib/content-platform-sanitize";
import { getPlatformContent } from "@/lib/content-platform-store";
import { upsertPostsPlatformState } from "@/lib/content-platform-upsert-server";
import type { FeedPost } from "@/types/database";

export interface PostsPlatformState {
  custom: FeedPost[];
  deletedMockIds: string[];
  /** Tombstones — custom posts removed by creators/admins (survives server merge). */
  deletedCustomIds?: string[];
  likeCounts?: Record<string, number>;
}

const EMPTY: PostsPlatformState = {
  custom: [],
  deletedMockIds: [],
  deletedCustomIds: [],
  likeCounts: {},
};

export async function GET() {
  const state = await getPlatformContent<PostsPlatformState>("posts", EMPTY);
  const sanitized = sanitizePostsPlatformState({
    custom: Array.isArray(state.custom) ? state.custom : [],
    deletedMockIds: Array.isArray(state.deletedMockIds) ? state.deletedMockIds : [],
    deletedCustomIds: Array.isArray(state.deletedCustomIds) ? state.deletedCustomIds : [],
    likeCounts:
      state.likeCounts && typeof state.likeCounts === "object" ? state.likeCounts : {},
  });
  return jsonLiveContent(sanitized);
}

export async function PUT(request: Request) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: PostsPlatformState;
    try {
      body = (await request.json()) as PostsPlatformState;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const result = await upsertPostsPlatformState({
      custom: Array.isArray(body.custom) ? body.custom : [],
      deletedMockIds: Array.isArray(body.deletedMockIds) ? body.deletedMockIds : [],
      deletedCustomIds: Array.isArray(body.deletedCustomIds) ? body.deletedCustomIds : [],
      likeCounts:
        body.likeCounts && typeof body.likeCounts === "object" ? body.likeCounts : {},
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: result.count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
