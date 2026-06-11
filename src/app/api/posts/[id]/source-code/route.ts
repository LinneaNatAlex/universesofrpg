import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import { getPostCodeFromDb, savePostCodeToDb } from "@/lib/post-code-vault-server";
import {
  canAccessPostSourceCode,
  canManagePostSourceCode,
} from "@/lib/post-source-access-server";
import { getPostFromPlatform } from "@/lib/posts-platform-server";
import type { PostCodeBundle } from "@/lib/post-code-vault";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireSessionUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: postId } = await context.params;
  const post = await getPostFromPlatform(postId);
  if (!post || post.type !== "code_template") {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  const allowed = await canAccessPostSourceCode(post, auth.user);
  if (!allowed) {
    return NextResponse.json({ error: "Purchase required to view source." }, { status: 403 });
  }

  const vaulted = await getPostCodeFromDb(postId);
  if (vaulted) {
    return NextResponse.json(vaulted);
  }

  if (post.html_code?.trim() && post.css_code?.trim()) {
    return NextResponse.json({
      html_code: post.html_code,
      css_code: post.css_code,
      js_code: post.js_code ?? null,
    } satisfies PostCodeBundle);
  }

  return NextResponse.json(
    {
      error:
        "Source code is not on the server yet. The seller must re-save or republish this listing.",
    },
    { status: 404 }
  );
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireSessionUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: postId } = await context.params;
  const post = await getPostFromPlatform(postId);
  if (!post || post.type !== "code_template") {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  const canManage = await canManagePostSourceCode(post, auth.user);
  if (!canManage) {
    return NextResponse.json({ error: "Not allowed to update this source." }, { status: 403 });
  }

  let body: PostCodeBundle;
  try {
    body = (await request.json()) as PostCodeBundle;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await savePostCodeToDb(postId, {
    html_code: String(body.html_code ?? ""),
    css_code: String(body.css_code ?? ""),
    js_code: body.js_code ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
