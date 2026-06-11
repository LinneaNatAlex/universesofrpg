"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { PostView } from "@/components/content/PostView";
import { MarketplaceCheckoutReturn } from "@/components/stripe/MarketplaceCheckoutReturn";
import { useAuth } from "@/hooks/useAuth";
import { usePost } from "@/hooks/usePost";
import { canViewPostDetail } from "@/lib/post-access";

export function PostPageClient() {
  const params = useParams();
  const id = params.id as string;
  const post = usePost(id);
  const { isLoggedIn, loading: authLoading } = useAuth();

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

  if (!authLoading && !canViewPostDetail(post, isLoggedIn)) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-comic text-ink-muted hover:text-comic-red"
        >
          <ArrowLeft className="h-4 w-4" /> Back to feed
        </Link>
        <LoginCTA message="Sign in to view code templates, live previews, and source access." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MarketplaceCheckoutReturn sellerUsername={post.author.username} />
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
