import { createServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";
import type { PostCodeBundle } from "@/lib/post-code-vault";

export async function getPostCodeFromDb(postId: string): Promise<PostCodeBundle | null> {
  if (!isServiceClientConfigured()) return null;

  const supabase = createServiceClient()!;
  const { data, error } = await supabase
    .from("post_code_vault")
    .select("html_code, css_code, js_code")
    .eq("post_id", postId)
    .maybeSingle();

  if (error || !data?.html_code?.trim() || !data?.css_code?.trim()) {
    return null;
  }

  return {
    html_code: data.html_code,
    css_code: data.css_code,
    js_code: data.js_code ?? null,
  };
}

export async function savePostCodeToDb(
  postId: string,
  bundle: PostCodeBundle
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!bundle.html_code?.trim() || !bundle.css_code?.trim()) {
    return { ok: false, error: "HTML and CSS are required." };
  }

  if (!isServiceClientConfigured()) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not set — run migration 006_post_code_vault.sql.",
    };
  }

  const supabase = createServiceClient()!;
  const { error } = await supabase.from("post_code_vault").upsert(
    {
      post_id: postId,
      html_code: bundle.html_code,
      css_code: bundle.css_code,
      js_code: bundle.js_code ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "post_id" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
