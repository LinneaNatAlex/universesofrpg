"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteComment, getAllComments, subscribeComments } from "@/lib/mock-comments";
import { Button } from "@/components/ui/button";
import type { Comment } from "@/types/database";
import { Trash2 } from "lucide-react";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const refresh = () => setComments(getAllComments());
    refresh();
    return subscribeComments(refresh);
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="font-comic text-xl text-ink">All comments ({comments.length})</h2>
      {comments.length === 0 && (
        <p className="text-ink-muted text-sm italic">No comments.</p>
      )}
      {comments.map((c) => (
        <div key={c.id} className="comic-panel p-4">
          <div className="flex justify-between gap-3 items-start">
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-comic text-comic-red">{c.author_display_name}</span>
                <span className="text-ink-muted text-xs ml-2">
                  on post{" "}
                  <Link href={`/post/${c.post_id}`} className="underline">
                    #{c.post_id}
                  </Link>
                </span>
              </p>
              <p className="text-sm mt-2 text-ink">{c.body}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-comic-red shrink-0"
              onClick={() => {
                if (confirm("Delete this comment?")) deleteComment(c.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
