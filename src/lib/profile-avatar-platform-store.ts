import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";

interface AvatarMediaRow {
  username: string;
  avatar_url: string;
  updated_at: string;
}

interface AvatarFileState {
  avatars: AvatarMediaRow[];
}

const DATA_PATH = join(process.cwd(), "data", "profile-avatars.json");

function userKey(username: string) {
  return username.toLowerCase();
}

function emptyState(): AvatarFileState {
  return { avatars: [] };
}

function readFileState(): AvatarFileState {
  try {
    if (!existsSync(DATA_PATH)) return emptyState();
    const parsed = JSON.parse(readFileSync(DATA_PATH, "utf8")) as AvatarFileState;
    return { avatars: Array.isArray(parsed.avatars) ? parsed.avatars : [] };
  } catch {
    return emptyState();
  }
}

function writeFileState(state: AvatarFileState): void {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(state, null, 2), "utf8");
}

export async function getAvatarMedia(username: string): Promise<string | null> {
  const key = userKey(username);

  const row = readFileState().avatars.find((a) => userKey(a.username) === key);
  const fromFile = row?.avatar_url?.trim() || null;

  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { data, error } = await supabase
      .from("profile_avatar_media")
      .select("avatar_url")
      .eq("username", key)
      .maybeSingle();

    if (!error && data?.avatar_url) {
      return data.avatar_url.trim() || null;
    }
  }

  return fromFile;
}

export async function upsertAvatarMedia(
  username: string,
  avatarUrl: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = userKey(username);

  if (!avatarUrl) {
    if (isServiceClientConfigured()) {
      const supabase = createServiceClient()!;
      const { error } = await supabase
        .from("profile_avatar_media")
        .delete()
        .eq("username", key);
      if (error) {
        return { ok: false, error: error.message };
      }
    }

    const state = readFileState();
    state.avatars = state.avatars.filter((a) => userKey(a.username) !== key);
    writeFileState(state);
    return { ok: true };
  }

  const row: AvatarMediaRow = {
    username: key,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  };

  const state = readFileState();
  state.avatars = [
    row,
    ...state.avatars.filter((a) => userKey(a.username) !== key),
  ];
  writeFileState(state);

  if (isServiceClientConfigured()) {
    const supabase = createServiceClient()!;
    const { error } = await supabase.from("profile_avatar_media").upsert({
      username: key,
      avatar_url: avatarUrl,
      updated_at: row.updated_at,
    });
    if (error) {
      return {
        ok: false,
        error: `${error.message} — run supabase/migrations/004_profile_avatar_media.sql`,
      };
    }
  }

  return { ok: true };
}
