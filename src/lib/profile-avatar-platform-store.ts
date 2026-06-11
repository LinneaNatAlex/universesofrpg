import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
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

function readFromFile(username: string): string | null {
  const row = readFileState().avatars.find((a) => userKey(a.username) === userKey(username));
  return row?.avatar_url?.trim() || null;
}

function writeToFile(username: string, avatarUrl: string | null): void {
  const key = userKey(username);
  const state = readFileState();
  if (!avatarUrl) {
    state.avatars = state.avatars.filter((a) => userKey(a.username) !== key);
  } else {
    state.avatars = [
      {
        username: key,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
      ...state.avatars.filter((a) => userKey(a.username) !== key),
    ];
  }
  writeFileState(state);
}

async function readFromSupabase(
  client: SupabaseClient,
  username: string
): Promise<string | null> {
  const { data, error } = await client
    .from("profile_avatar_media")
    .select("avatar_url")
    .eq("username", userKey(username))
    .maybeSingle();

  if (error || !data?.avatar_url) return null;
  return data.avatar_url.trim() || null;
}

async function writeToSupabase(
  client: SupabaseClient,
  username: string,
  avatarUrl: string | null
): Promise<string | null> {
  const key = userKey(username);

  if (!avatarUrl) {
    const { error } = await client.from("profile_avatar_media").delete().eq("username", key);
    return error?.message ?? null;
  }

  const { error } = await client.from("profile_avatar_media").upsert({
    username: key,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  });

  return error?.message ?? null;
}

export async function getAvatarMedia(username: string): Promise<string | null> {
  if (isServiceClientConfigured()) {
    const fromDb = await readFromSupabase(createServiceClient()!, username);
    if (fromDb) return fromDb;
  }

  return readFromFile(username);
}

export async function upsertAvatarMedia(
  username: string,
  avatarUrl: string | null,
  options: {
    sessionClient?: SupabaseClient | null;
    /** Demo personas need service role + migration (no RLS insert for other usernames). */
    requireSupabase?: boolean;
  } = {}
): Promise<{ ok: true; storage: "supabase" | "file" } | { ok: false; error: string }> {
  const { sessionClient, requireSupabase = false } = options;
  let supabaseError: string | null = null;

  if (isServiceClientConfigured()) {
    supabaseError = await writeToSupabase(createServiceClient()!, username, avatarUrl);
    if (!supabaseError) {
      writeToFile(username, avatarUrl);
      return { ok: true, storage: "supabase" };
    }
  }

  if (sessionClient) {
    supabaseError = await writeToSupabase(sessionClient, username, avatarUrl);
    if (!supabaseError) {
      writeToFile(username, avatarUrl);
      return { ok: true, storage: "supabase" };
    }
  }

  if (requireSupabase) {
    const needsServiceRole = !isServiceClientConfigured();
    return {
      ok: false,
      error: needsServiceRole
        ? "Demo persona photos need SUPABASE_SERVICE_ROLE_KEY in .env.local (and on Netlify). Copy it from Supabase → Settings → API → service_role."
        : `${supabaseError ?? "Could not save to Supabase."} Run supabase/migrations/004_profile_avatar_media.sql in the SQL Editor.`,
    };
  }

  writeToFile(username, avatarUrl);
  return { ok: true, storage: "file" };
}
