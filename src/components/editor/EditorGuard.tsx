"use client";

import Link from "next/link";
import { useEditor } from "@/hooks/useEditor";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { useAdmin } from "@/hooks/useAdmin";

export function EditorGuard({ children }: { children: React.ReactNode }) {
  const { loading, isLoggedIn } = useAdmin();
  const { isEditor, ready: editorReady } = useEditor();

  if (loading || (isLoggedIn && !editorReady)) {
    return (
      <div className="comic-panel p-12 text-center font-comic text-ink-muted">
        Checking editor access…
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="font-comic text-2xl text-ink text-center">Editor Portal</h1>
        <LoginCTA message="Sign in to access the editor review queue." />
      </div>
    );
  }

  if (!isEditor) {
    return (
      <div className="comic-panel p-8 max-w-lg mx-auto text-center space-y-4">
        <h1 className="font-comic text-xl text-comic-red">Editor access required</h1>
        <p className="text-sm text-ink-muted">
          You need an approved editor licence to review content. Free posts are auto-approved;
          paid Shop listings require a certified editor.
        </p>
        <Link
          href="/apply/editor"
          className="inline-block font-comic text-comic-red hover:underline"
        >
          Apply to become an editor →
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
