import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/post-access";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeRedirectPath(searchParams.get("next"));
  const loginUrl = `${origin}/login?next=${encodeURIComponent(next)}`;

  const oauthError = searchParams.get("error");
  if (oauthError === "access_denied") {
    return NextResponse.redirect(`${loginUrl}&error=cancelled`);
  }
  if (oauthError) {
    return NextResponse.redirect(`${loginUrl}&error=auth`);
  }

  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${loginUrl}&error=cancelled`);
  }

  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) {
    return NextResponse.redirect(`${loginUrl}&error=auth`);
  }

  const cookieStore = await cookies();
  const successUrl = `${origin}/oauth-return?next=${encodeURIComponent(next)}`;
  let response = NextResponse.redirect(successUrl);

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] code exchange failed:", error.message);
    return NextResponse.redirect(`${loginUrl}&error=auth`);
  }

  return response;
}
