import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import { jsonLiveContent } from "@/lib/api-live-json";
import { sanitizeEditorsPlatformState } from "@/lib/editor-platform-sanitize";
import {
  getPlatformContent,
  setPlatformContent,
} from "@/lib/content-platform-store";
import type { EditorProfile } from "@/types/database";

export interface EditorsPlatformState {
  profiles: EditorProfile[];
}

const EMPTY: EditorsPlatformState = { profiles: [] };

export async function GET() {
  const state = await getPlatformContent<EditorsPlatformState>("editors", EMPTY);
  return jsonLiveContent(
    sanitizeEditorsPlatformState({
      profiles: Array.isArray(state.profiles) ? state.profiles : [],
    })
  );
}

export async function PUT(request: Request) {
  try {
    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: EditorsPlatformState;
    try {
      body = (await request.json()) as EditorsPlatformState;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const state = sanitizeEditorsPlatformState({
      profiles: Array.isArray(body.profiles) ? body.profiles : [],
    });

    const result = await setPlatformContent("editors", state);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: state.profiles.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
