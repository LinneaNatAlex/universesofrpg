"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { getPostFromStore, subscribePosts } from "@/lib/posts-store";
import { isPostLiked, subscribeLikes, toggleLike } from "@/lib/likes-store";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
  className?: string;
}

export function LikeButton({ postId, initialCount, className }: LikeButtonProps) {
  const { isLoggedIn } = useAuth();
  const identity = useActingIdentity();
  const username = identity?.username ?? null;

  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const refreshCount = () => {
      const post = getPostFromStore(postId);
      if (post) setCount(post.like_count);
    };
    refreshCount();
    return subscribePosts(refreshCount);
  }, [postId]);

  useEffect(() => {
    if (!username) {
      setLiked(false);
      return;
    }
    const refreshLiked = () => setLiked(isPostLiked(username, postId));
    refreshLiked();
    return subscribeLikes(refreshLiked);
  }, [username, postId]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!username) return;

    const result = toggleLike(username, postId, identity?.displayName);
    setLiked(result.liked);
    setCount(result.count);
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 transition-all",
          "hover:text-comic-red text-ink-muted",
          className
        )}
        title="Sign in to like"
        aria-label="Sign in to like this post"
      >
        <Heart className="h-4 w-4" />
        <span className="text-xs font-comic">{count}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 transition-all relative z-10",
        "hover:text-comic-red cursor-pointer",
        liked && "text-comic-red",
        className
      )}
      aria-label={liked ? "Unlike post" : "Like post"}
      aria-pressed={liked}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      <span className="text-xs font-comic">{count}</span>
    </button>
  );
}
