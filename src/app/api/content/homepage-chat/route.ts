import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import { sanitizeHomepageChatPlatformState } from "@/lib/homepage-chat-platform-sanitize";
import { getPlatformContent } from "@/lib/content-platform-store";
import { upsertHomepageChatPlatformState } from "@/lib/content-platform-upsert-server";
import type { HomepageChatMessage } from "@/types/database";

export interface HomepageChatPlatformState {
  messages: HomepageChatMessage[];
  deletedIds: string[];
  nameColors: Record<string, string>;
}

const EMPTY: HomepageChatPlatformState = {
  messages: [],
  deletedIds: [],
  nameColors: {},
};

export async function GET() {
  const state = await getPlatformContent<HomepageChatPlatformState>("homepage_chat", EMPTY);
    return NextResponse.json(
    sanitizeHomepageChatPlatformState({
      messages: Array.isArray(state.messages) ? state.messages : [],
      deletedIds: Array.isArray(state.deletedIds) ? state.deletedIds : [],
      nameColors:
        state.nameColors && typeof state.nameColors === "object" ? state.nameColors : {},
    })
  );
}

export async function PUT(request: Request) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: HomepageChatPlatformState;
    try {
      body = (await request.json()) as HomepageChatPlatformState;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const result = await upsertHomepageChatPlatformState({
      messages: Array.isArray(body.messages) ? body.messages : [],
      deletedIds: Array.isArray(body.deletedIds) ? body.deletedIds : [],
      nameColors:
        body.nameColors && typeof body.nameColors === "object" ? body.nameColors : {},
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
