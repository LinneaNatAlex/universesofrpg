import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import { sanitizeCommentsPlatformState } from "@/lib/comments-platform-sanitize";
import { getPlatformContent } from "@/lib/content-platform-store";
import { upsertCommentsPlatformState } from "@/lib/content-platform-upsert-server";
import type { Comment } from "@/types/database";

export interface CommentsPlatformState {
  custom: Comment[];
  deletedMockIds: string[];
}

const EMPTY: CommentsPlatformState = {
  custom: [],
  deletedMockIds: [],
};

export async function GET() {
  const state = await getPlatformContent<CommentsPlatformState>("comments", EMPTY);
  return NextResponse.json(
    sanitizeCommentsPlatformState({
      custom: Array.isArray(state.custom) ? state.custom : [],
      deletedMockIds: Array.isArray(state.deletedMockIds) ? state.deletedMockIds : [],
    })
  );
}

export async function PUT(request: Request) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: CommentsPlatformState;
    try {
      body = (await request.json()) as CommentsPlatformState;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const result = await upsertCommentsPlatformState({
      custom: Array.isArray(body.custom) ? body.custom : [],
      deletedMockIds: Array.isArray(body.deletedMockIds) ? body.deletedMockIds : [],
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
