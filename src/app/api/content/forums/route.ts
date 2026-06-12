import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import { getPlatformContent } from "@/lib/content-platform-store";
import { upsertForumsPlatformState } from "@/lib/content-platform-upsert-server";
import { sanitizeForumsPlatformState } from "@/lib/forums-platform-sanitize";
import type { RpgForum } from "@/types/database";

export interface ForumsPlatformState {
  custom: RpgForum[];
  deletedMockIds: string[];
  deletedCustomIds?: string[];
}

const EMPTY: ForumsPlatformState = {
  custom: [],
  deletedMockIds: [],
  deletedCustomIds: [],
};

export async function GET() {
  const state = await getPlatformContent<ForumsPlatformState>("forums", EMPTY);
  return NextResponse.json(
    sanitizeForumsPlatformState({
      custom: Array.isArray(state.custom) ? state.custom : [],
      deletedMockIds: Array.isArray(state.deletedMockIds) ? state.deletedMockIds : [],
      deletedCustomIds: Array.isArray(state.deletedCustomIds) ? state.deletedCustomIds : [],
    })
  );
}

export async function PUT(request: Request) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: ForumsPlatformState;
    try {
      body = (await request.json()) as ForumsPlatformState;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const result = await upsertForumsPlatformState({
      custom: Array.isArray(body.custom) ? body.custom : [],
      deletedMockIds: Array.isArray(body.deletedMockIds) ? body.deletedMockIds : [],
      deletedCustomIds: Array.isArray(body.deletedCustomIds) ? body.deletedCustomIds : [],
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
