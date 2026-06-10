"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
}

export function LikeButton({ postId, initialCount }: LikeButtonProps) {
  const { isLoggedIn, loading } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [showLoginHint, setShowLoginHint] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    if (!isLoggedIn) {
      setShowLoginHint(true);
      window.setTimeout(() => setShowLoginHint(false), 3000);
      return;
    }

    setLiked((prev) => {
      const next = !prev;
      setCount((c) => c + (next ? 1 : -1));
      return next;
    });

    // TODO: persist to Supabase likes table when auth is fully wired
    void postId;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={cn(
          "flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-all",
          "hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer",
          liked && "text-rose-400",
          loading && "opacity-50 cursor-wait"
        )}
        aria-label={liked ? "Unlike post" : "Like post"}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-transform",
            liked && "fill-current scale-110",
            !loading && "active:scale-125"
          )}
        />
        <span>{count}</span>
      </button>

      {showLoginHint && (
        <div
          role="status"
          className="absolute bottom-full left-0 mb-2 z-20 rounded-lg border border-violet-500/30 bg-surface-elevated px-3 py-2 text-xs shadow-glow whitespace-nowrap"
        >
          <Link href="/login" className="text-violet-400 hover:underline font-medium">
            Sign in
          </Link>{" "}
          to like posts
        </div>
      )}
    </div>
  );
}
