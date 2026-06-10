"use client";

import { useEffect, useState } from "react";
import { getCommentsForPost, subscribeComments } from "@/lib/mock-comments";
import type { Comment } from "@/types/database";

export function usePostComments(postId: string): Comment[] {
  const [comments, setComments] = useState<Comment[]>(() =>
    getCommentsForPost(postId)
  );

  useEffect(() => {
    setComments(getCommentsForPost(postId));
    return subscribeComments(() => setComments(getCommentsForPost(postId)));
  }, [postId]);

  return comments;
}
