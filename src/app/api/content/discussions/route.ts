import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import { getPlatformContent } from "@/lib/content-platform-store";
import { upsertDiscussionsPlatformState } from "@/lib/content-platform-upsert-server";
import { sanitizeDiscussionsPlatformState } from "@/lib/discussions-platform-sanitize";
import type { DiscussionReply, DiscussionThread } from "@/types/database";

export interface DiscussionsPlatformState {
  customThreads: DiscussionThread[];
  customReplies: DiscussionReply[];
  deletedMockThreadIds: string[];
}

const EMPTY: DiscussionsPlatformState = {
  customThreads: [],
  customReplies: [],
  deletedMockThreadIds: [],
};

export async function GET() {
  const state = await getPlatformContent<DiscussionsPlatformState>("discussions", EMPTY);
  return NextResponse.json(
    sanitizeDiscussionsPlatformState({
      customThreads: Array.isArray(state.customThreads) ? state.customThreads : [],
      customReplies: Array.isArray(state.customReplies) ? state.customReplies : [],
      deletedMockThreadIds: Array.isArray(state.deletedMockThreadIds)
        ? state.deletedMockThreadIds
        : [],
    })
  );
}

export async function PUT(request: Request) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: DiscussionsPlatformState;
    try {
      body = (await request.json()) as DiscussionsPlatformState;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const result = await upsertDiscussionsPlatformState({
      customThreads: Array.isArray(body.customThreads) ? body.customThreads : [],
      customReplies: Array.isArray(body.customReplies) ? body.customReplies : [],
      deletedMockThreadIds: Array.isArray(body.deletedMockThreadIds)
        ? body.deletedMockThreadIds
        : [],
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      threads: result.count,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
