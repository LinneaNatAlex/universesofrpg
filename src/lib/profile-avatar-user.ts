import { createClient } from "@/lib/supabase/server";
import { createServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function setProfileAvatarForUser(
  userId: string,
  avatarUrl: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId);

    if (error) {
      if (isServiceClientConfigured()) {
        const admin = createServiceClient()!;
        const { error: adminError } = await admin
          .from("profiles")
          .update({ avatar_url: avatarUrl })
          .eq("id", userId);
        if (adminError) {
          return { ok: false, error: adminError.message };
        }
        return { ok: true };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not save profile photo.",
    };
  }
}
