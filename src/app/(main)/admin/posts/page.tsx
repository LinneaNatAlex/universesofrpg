"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  deletePost,
  getAllPosts,
  setPostModeration,
  subscribePosts,
} from "@/lib/posts-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FeedPost } from "@/types/database";
import { Trash2, Check, X } from "lucide-react";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    const refresh = () => setPosts(getAllPosts());
    refresh();
    return subscribePosts(refresh);
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="font-comic text-xl text-ink">All posts ({posts.length})</h2>
      {posts.map((post) => (
        <div key={post.id} className="comic-panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <Link href={`/post/${post.id}`} className="font-comic text-ink hover:text-comic-red">
              {post.title}
            </Link>
            <p className="text-xs text-ink-muted mt-0.5">
              by @{post.author.username} · {post.type}
            </p>
          </div>
          <Badge variant={post.moderation_status === "approved" ? "free" : "paid"}>
            {post.moderation_status}
          </Badge>
          <div className="flex flex-wrap gap-2">
            {post.moderation_status !== "approved" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPostModeration(post.id, "approved")}
              >
                <Check className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
            )}
            {post.moderation_status !== "rejected" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPostModeration(post.id, "rejected")}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-comic-red"
              onClick={() => {
                if (confirm(`Delete "${post.title}"?`)) deletePost(post.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
