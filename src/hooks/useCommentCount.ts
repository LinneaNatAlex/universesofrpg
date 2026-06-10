"use client";

import { useEffect, useState } from "react";
import { getCommentCount, subscribeComments } from "@/lib/mock-comments";

export function useCommentCount(postId: string): number {
  const [count, setCount] = useState(() => getCommentCount(postId));

  useEffect(() => {
    setCount(getCommentCount(postId));
    return subscribeComments(() => setCount(getCommentCount(postId)));
  }, [postId]);

  return count;
}
