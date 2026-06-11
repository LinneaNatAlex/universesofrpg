"use client";

import { useEffect, useState } from "react";
import { getPostById } from "@/lib/posts";
import { subscribePosts } from "@/lib/posts-store";
import type { FeedPost } from "@/types/database";

export function usePost(id: string): FeedPost | undefined | null {
  const [post, setPost] = useState<FeedPost | undefined | null>(undefined);

  useEffect(() => {
    const refresh = () => setPost(getPostById(id) ?? null);
    refresh();
    return subscribePosts(refresh);
  }, [id]);

  return post;
}
