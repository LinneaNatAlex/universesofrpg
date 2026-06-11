"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  deleteForum,
  deleteForumPost,
  getAllForums,
  subscribeForums,
} from "@/lib/forums-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RpgForum } from "@/types/database";
import { Search, Trash2 } from "lucide-react";

function forumMatchesQuery(forum: RpgForum, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (forum.title.toLowerCase().includes(q)) return true;
  if (forum.id.toLowerCase().includes(q)) return true;
  if (forum.members.some((m) => m.toLowerCase().includes(q))) return true;

  return forum.chapters.some((chapter) => {
    if (chapter.title.toLowerCase().includes(q)) return true;
    return chapter.posts.some(
      (post) =>
        post.author_username.toLowerCase().includes(q) ||
        post.body.toLowerCase().includes(q)
    );
  });
}

export default function AdminTopicsPage() {
  const [forums, setForums] = useState<RpgForum[]>([]);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setForums(getAllForums());
    refresh();
    return subscribeForums(refresh);
  }, []);

  const filtered = useMemo(
    () => forums.filter((forum) => forumMatchesQuery(forum, query)),
    [forums, query]
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-comic text-xl text-ink">RPG Topics ({forums.length})</h2>
        <p className="text-sm text-ink-muted mt-1">
          Search topics and remove individual posts or entire topics from the site.
        </p>
      </div>

      <div className="comic-panel flex items-center gap-2 px-4 py-2">
        <Search className="h-4 w-4 text-ink-muted shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, member, post text…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="comic-panel p-6 text-center text-ink-muted font-comic">
          No topics match your search.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((forum) => {
            const postCount = forum.chapters.reduce(
              (sum, chapter) => sum + chapter.posts.length,
              0
            );
            const expanded = expandedId === forum.id;

            return (
              <div key={forum.id} className="comic-panel p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/forum/${forum.id}`}
                      className="font-comic text-lg text-ink hover:text-comic-red"
                    >
                      {forum.title}
                    </Link>
                    <p className="text-xs text-ink-muted mt-1">
                      {forum.id} · {forum.chapters.length} chapter(s) · {postCount} post(s)
                    </p>
                    <p className="text-xs text-ink-muted mt-1">
                      Writers: {forum.members.join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setExpandedId(expanded ? null : forum.id)}
                    >
                      {expanded ? "Hide posts" : "Manage posts"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-comic-red"
                      onClick={() => {
                        if (confirm(`Delete entire topic "${forum.title}"?`)) {
                          deleteForum(forum.id);
                          if (expandedId === forum.id) setExpandedId(null);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete topic
                    </Button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t-2 border-dashed border-ink pt-3 space-y-4">
                    {forum.chapters.map((chapter, chapterIndex) => (
                      <div key={`${forum.id}-ch-${chapter.number}`}>
                        <p className="font-comic text-sm text-ink mb-2">
                          Chapter {chapter.number}: {chapter.title}
                          <Badge variant="tag" className="ml-2 text-[10px]">
                            {chapter.posts.length} posts
                          </Badge>
                        </p>
                        {chapter.posts.length === 0 ? (
                          <p className="text-xs text-ink-muted italic">No posts.</p>
                        ) : (
                          <ul className="space-y-2">
                            {chapter.posts.map((post) => (
                              <li
                                key={post.id}
                                className="border-2 border-ink bg-surface p-3 flex flex-col sm:flex-row sm:items-start gap-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-comic text-xs text-comic-red">
                                    @{post.author_username}
                                  </p>
                                  <p className="text-sm mt-1 line-clamp-3 whitespace-pre-wrap">
                                    {post.body}
                                  </p>
                                  <p className="text-[10px] text-ink-muted mt-1">{post.id}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-comic-red shrink-0"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Delete this post by @${post.author_username}?`
                                      )
                                    ) {
                                      deleteForumPost(forum.id, chapterIndex, post.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Delete post
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
