import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import {
  getPlatformContent,
  setPlatformContent,
} from "@/lib/content-platform-store";
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
  return NextResponse.json({
    custom: Array.isArray(state.custom) ? state.custom : [],
    deletedMockIds: Array.isArray(state.deletedMockIds) ? state.deletedMockIds : [],
    deletedCustomIds: Array.isArray(state.deletedCustomIds) ? state.deletedCustomIds : [],
  });
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

    const state: ForumsPlatformState = {
      custom: Array.isArray(body.custom) ? body.custom : [],
      deletedMockIds: Array.isArray(body.deletedMockIds) ? body.deletedMockIds : [],
      deletedCustomIds: Array.isArray(body.deletedCustomIds) ? body.deletedCustomIds : [],
    };

    const result = await setPlatformContent("forums", state);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: state.custom.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
