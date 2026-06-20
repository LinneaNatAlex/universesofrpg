import { sanitizeChatNameColor } from "@/lib/homepage-chat-colors";
import { createClient } from "@/lib/supabase/client";

export { parseChatNameColorFromMetadata } from "@/lib/chat-name-color-device";

export async function persistChatNameColorToAccount(color: string): Promise<boolean> {
  const sanitized = sanitizeChatNameColor(color);
  if (!sanitized) return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { chat_name_color: sanitized },
    });
    return !error;
  } catch {
    return false;
  }
}
