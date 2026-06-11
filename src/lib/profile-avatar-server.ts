import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isAdminUser } from "@/lib/admin";
import { getPersonaByUsername } from "@/lib/personas";
import {
  getAvatarMedia,
  upsertAvatarMedia,
} from "@/lib/profile-avatar-platform-store";
import { setProfileAvatarForUser } from "@/lib/profile-avatar-user";

const MAX_AVATAR_DATA_URL_LENGTH = 900_000;

export function isAcceptableAvatarUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed.length < 2048;
  }
  if (trimmed.startsWith("data:image/")) {
    return (
      /^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(trimmed) &&
      trimmed.length <= MAX_AVATAR_DATA_URL_LENGTH
    );
  }
  return false;
}

export async function getProfileAvatarFromDb(
  username: string
): Promise<string | null> {
  const key = username.toLowerCase();

  const media = await getAvatarMedia(key);
  if (media && isAcceptableAvatarUrl(media)) return media;

  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("username", key)
      .maybeSingle();

    if (error || !data?.avatar_url) return null;
    const url = data.avatar_url.trim();
    return isAcceptableAvatarUrl(url) ? url : null;
  } catch {
    return null;
  }
}

export async function resolveAvatarTargetUsername(
  authUserId: string,
  authUsername: string,
  forUsername?: string | null
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const target = (forUsername?.trim() || authUsername).toLowerCase();

  if (target === authUsername.toLowerCase()) {
    return { ok: true, username: target };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "You can only change your own profile photo here.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminUser(user)) {
      return {
        ok: false,
        error: "You can only change your own profile photo.",
      };
    }

    if (!getPersonaByUsername(target)) {
      return { ok: false, error: "Unknown demo persona username." };
    }

    return { ok: true, username: target };
  } catch {
    return { ok: false, error: "Could not verify avatar target." };
  }
}

export async function saveProfileAvatar(
  authUserId: string,
  authUsername: string,
  avatarUrl: string | null,
  forUsername?: string | null
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const target = await resolveAvatarTargetUsername(
    authUserId,
    authUsername,
    forUsername
  );
  if (!target.ok) return target;

  if (avatarUrl !== null && !isAcceptableAvatarUrl(avatarUrl)) {
    return {
      ok: false,
      error: "Invalid or too large image. Try a smaller JPG or PNG.",
    };
  }

  const supabase = await createClient();
  const isPersonaTarget = target.username !== authUsername.toLowerCase();

  const media = await upsertAvatarMedia(target.username, avatarUrl, {
    sessionClient: supabase,
    requireSupabase: isPersonaTarget,
  });
  if (!media.ok) return media;

  if (target.username === authUsername.toLowerCase()) {
    const profile = await setProfileAvatarForUser(authUserId, avatarUrl);
    if (!profile.ok) {
      return profile;
    }
  }

  return { ok: true, username: target.username };
}
