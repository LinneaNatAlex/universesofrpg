"use client";

import { useEffect, useState } from "react";
import { getCommentCount, subscribeComments } from "@/lib/mock-comments";
import { getAllPosts, subscribePosts } from "@/lib/posts-store";
import type { FeedPost } from "@/types/database";

function enrich(posts: FeedPost[]): FeedPost[] {
  return posts.map((p) => ({ ...p, comment_count: getCommentCount(p.id) }));
}

export function useAuthorPosts(username: string, includePending = false): FeedPost[] {
  const [posts, setPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    function refresh() {
      const filtered = getAllPosts()
        .filter((p) => p.author.username.toLowerCase() === username.toLowerCase())
        .filter((p) => includePending || p.moderation_status === "approved");

      setPosts(
        enrich(
          [...filtered].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        )
      );
    }
    refresh();
    const u1 = subscribePosts(refresh);
    const u2 = subscribeComments(refresh);
    return () => {
      u1();
      u2();
    };
  }, [username, includePending]);

  return posts;
}
