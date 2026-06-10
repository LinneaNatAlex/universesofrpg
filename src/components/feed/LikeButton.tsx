"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
}

export function LikeButton({ postId, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setLiked((prev) => {
      const next = !prev;
      setCount((c) => c + (next ? 1 : -1));
      return next;
    });

    void postId;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 transition-all",
        "hover:text-comic-red cursor-pointer",
        liked && "text-comic-red"
      )}
      aria-label={liked ? "Unlike post" : "Like post"}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      <span className="text-xs font-comic">{count}</span>
    </button>
  );
}
