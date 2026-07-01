import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import { jsonLiveContent } from "@/lib/api-live-json";
import { sanitizePrivateMessagesPlatformState } from "@/lib/private-messages-platform-sanitize";
import {
  getPlatformContent,
  setPlatformContent,
} from "@/lib/content-platform-store";
import type { ChatMessage, Conversation } from "@/types/database";

export interface PrivateMessagesPlatformState {
  conversations: Conversation[];
  messages: ChatMessage[];
}

const EMPTY: PrivateMessagesPlatformState = {
  conversations: [],
  messages: [],
};

export async function GET() {
  const state = await getPlatformContent<PrivateMessagesPlatformState>(
    "private_messages",
    EMPTY,
  );
  return jsonLiveContent(
    sanitizePrivateMessagesPlatformState({
      conversations: Array.isArray(state.conversations)
        ? state.conversations
        : [],
      messages: Array.isArray(state.messages) ? state.messages : [],
    }),
  );
}

export async function PUT(request: Request) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: PrivateMessagesPlatformState;
    try {
      body = (await request.json()) as PrivateMessagesPlatformState;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const state = sanitizePrivateMessagesPlatformState({
      conversations: Array.isArray(body.conversations) ? body.conversations : [],
      messages: Array.isArray(body.messages) ? body.messages : [],
    });

    const result = await setPlatformContent("private_messages", state);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      conversations: state.conversations.length,
      messages: state.messages.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
