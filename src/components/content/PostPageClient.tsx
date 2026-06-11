"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostView } from "@/components/content/PostView";
import { usePost } from "@/hooks/usePost";

export function PostPageClient() {
  const params = useParams();
  const id = params.id as string;
  const post = usePost(id);

  if (post === undefined) {
    return (
      <div className="comic-panel p-8 text-center font-comic text-ink-muted">
        Loading post…
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="comic-panel p-8 text-center space-y-3">
        <h1 className="font-comic text-xl text-ink">Post not found</h1>
        <p className="text-sm text-ink-muted">
          This post may have been removed, or it only exists in your current session.
        </p>
        <Link href="/" className="font-comic text-comic-red hover:underline text-sm">
          ← Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-comic text-ink-muted hover:text-comic-red"
      >
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>
      <Suspense
        fallback={
          <div className="comic-panel p-8 text-center font-comic text-ink-muted">
            Loading post…
          </div>
        }
      >
        <PostView post={post} />
      </Suspense>
    </div>
  );
}
