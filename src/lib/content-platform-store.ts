import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ForumsPlatformState } from "@/app/api/content/forums/route";
import { mergeForumsState } from "@/lib/content-platform-merge";
import { createServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";

export type PlatformContentKey =
  | "posts"
  | "forums"
  | "comments"
  | "discussions"
  | "homepage_chat"
  | "friend_requests"
  | "friends";

const DATA_DIR = join(process.cwd(), "data");

function dataPath(key: PlatformContentKey): string {
  return join(DATA_DIR, `platform-${key}.json`);
}

function readFilePayload<T>(key: PlatformContentKey, fallback: T): T {
  try {
    const path = dataPath(key);
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeFilePayload<T>(key: PlatformContentKey, payload: T): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(dataPath(key), JSON.stringify(payload, null, 2), "utf8");
  } catch {
    // Netlify/serverless uses a read-only filesystem — Supabase is the source of truth.
  }
}

export async function getPlatformContent<T>(
  key: PlatformContentKey,
  fallback: T
): Promise<T> {
  const filePayload = readFilePayload(key, fallback);

  if (isServiceClientConfigured()) {
    try {
      const supabase = createServiceClient()!;
      const { data, error } = await supabase
        .from("platform_content_state")
        .select("payload")
        .eq("content_key", key)
        .maybeSingle();

      if (!error && data?.payload && typeof data.payload === "object") {
        if (key === "forums") {
          return mergeForumsState(
            filePayload as ForumsPlatformState,
            data.payload as ForumsPlatformState
          ) as T;
        }
        return data.payload as T;
      }
    } catch {
      // Fall through to local dev file cache.
    }
  }

  return filePayload;
}

export async function setPlatformContent<T>(
  key: PlatformContentKey,
  payload: T
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    writeFilePayload(key, payload);

    if (!isServiceClientConfigured()) {
      return {
        ok: false,
        error:
          "SUPABASE_SERVICE_ROLE_KEY is not set on the server — add it in Netlify environment variables.",
      };
    }

    const supabase = createServiceClient()!;
    const { error } = await supabase.from("platform_content_state").upsert(
      {
        content_key: key,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "content_key" }
    );

    if (error) {
      return {
        ok: false,
        error: `${error.message} — confirm migration 005_platform_content.sql was run.`,
      };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    return { ok: false, error: message };
  }
}
