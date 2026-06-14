import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import { sanitizePostForSync } from "@/lib/content-platform-sanitize";
import { upsertSinglePostPlatformState } from "@/lib/content-platform-upsert-server";
import type { FeedPost } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: postId } = await context.params;

    let body: FeedPost;
    try {
      body = (await request.json()) as FeedPost;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!body?.id || body.id !== postId) {
      return NextResponse.json({ error: "Post id mismatch." }, { status: 400 });
    }

    const result = await upsertSinglePostPlatformState(sanitizePostForSync(body));
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
