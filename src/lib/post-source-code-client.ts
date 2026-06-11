"use client";

import { authFetchHeaders } from "@/lib/api-client-auth";
import type { PostCodeBundle } from "@/lib/post-code-vault";

export async function fetchPostSourceCode(
  postId: string
): Promise<{ ok: true; bundle: PostCodeBundle } | { ok: false; error: string }> {
  try {
    const headers = await authFetchHeaders();
    const res = await fetch(`/api/posts/${postId}/source-code`, {
      credentials: "include",
      headers,
      cache: "no-store",
    });

    const data = (await res.json().catch(() => ({}))) as PostCodeBundle & {
      error?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? `Could not load source (${res.status}).`,
      };
    }

    if (!data.html_code?.trim() || !data.css_code?.trim()) {
      return { ok: false, error: "Source code is empty on the server." };
    }

    return {
      ok: true,
      bundle: {
        html_code: data.html_code,
        css_code: data.css_code,
        js_code: data.js_code ?? null,
      },
    };
  } catch {
    return { ok: false, error: "Network error loading source code." };
  }
}

export async function pushPostSourceCodeToServer(
  postId: string,
  bundle: PostCodeBundle
): Promise<boolean> {
  try {
    const headers = await authFetchHeaders();
    const res = await fetch(`/api/posts/${postId}/source-code`, {
      method: "PUT",
      credentials: "include",
      headers,
      body: JSON.stringify(bundle),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      console.warn("[source-sync]", data.error ?? res.status);
    }
    return res.ok;
  } catch {
    return false;
  }
}
