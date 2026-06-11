"use client";

import { useEffect, useState } from "react";
import { getCommentCount, subscribeComments } from "@/lib/mock-comments";

export function useCommentCount(postId: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getCommentCount(postId));
    return subscribeComments(() => setCount(getCommentCount(postId)));
  }, [postId]);

  return count;
}
