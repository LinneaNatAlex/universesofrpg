import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";

export type PlatformContentKey = "posts" | "forums";

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
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(dataPath(key), JSON.stringify(payload, null, 2), "utf8");
}

export async function getPlatformContent<T>(
  key: PlatformContentKey,
  fallback: T
): Promise<T> {
  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { data, error } = await supabase
      .from("platform_content_state")
      .select("payload")
      .eq("content_key", key)
      .maybeSingle();

    if (!error && data?.payload && typeof data.payload === "object") {
      return data.payload as T;
    }
  }

  return readFilePayload(key, fallback);
}

export async function setPlatformContent<T>(
  key: PlatformContentKey,
  payload: T
): Promise<{ ok: true } | { ok: false; error: string }> {
  writeFilePayload(key, payload);

  if (!isServiceClientConfigured()) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not set — content saved locally on server only.",
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
      error: `${error.message} — run supabase/migrations/005_platform_content.sql`,
    };
  }

  return { ok: true };
}
