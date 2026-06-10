"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { MOCK_FORUMS, MOCK_FRIENDS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RpgForumMeta } from "@/types/database";
import { Plus, Users } from "lucide-react";

function ForumMetaLine({ meta }: { meta: RpgForumMeta }) {
  return (
    <p className="forum-meta">
      {meta.when} · {meta.era} · {meta.season} · {meta.location}
    </p>
  );
}

export function ForumList() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return <div className="comic-panel p-8 text-center font-comic">Loading…</div>;

  if (!isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="font-comic text-3xl text-ink text-center">Private RPG Forum</h1>
        <p className="text-center text-sm text-ink-muted">
          Write stories with friends — chapters, settings, and roleplay posts.
        </p>
        <LoginCTA message="Log in to access your private forums." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-comic text-3xl text-ink">Your forums</h1>
          <p className="text-sm text-ink-muted">Private RPG writing with friends</p>
        </div>
        <Link href="/forum/new">
          <Button variant="comic">
            <Plus className="h-4 w-4 mr-1" />
            New forum
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {MOCK_FORUMS.map((forum) => (
          <Link
            key={forum.id}
            href={`/forum/${forum.id}`}
            className="comic-card p-4 block hover:no-underline"
          >
            <div className="flex gap-3">
              {forum.book_cover_url && (
                <div className="comic-cover shrink-0">
                  <Image
                    src={forum.book_cover_url}
                    alt=""
                    width={64}
                    height={90}
                    unoptimized
                  />
                </div>
              )}
              <div>
                <h3 className="font-comic text-xl text-ink">{forum.title}</h3>
                <p className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                  <Users className="h-3 w-3" />
                  {forum.members.join(", ")}
                </p>
                <Badge variant="tag" className="mt-2">
                  {forum.chapters.length} chapter(s)
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function NewForumForm() {
  const { isLoggedIn, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [friendQuery, setFriendQuery] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [chapterTitle, setChapterTitle] = useState("Chapter 1");
  const [meta, setMeta] = useState<RpgForumMeta>({
    era: "",
    season: "",
    location: "",
    when: "",
  });
  const [firstPost, setFirstPost] = useState("");

  if (loading) return null;
  if (!isLoggedIn) {
    return <LoginCTA message="You must be logged in to start a forum." />;
  }

  const filteredFriends = MOCK_FRIENDS.filter(
    (f) =>
      f.display_name.toLowerCase().includes(friendQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(friendQuery.toLowerCase())
  );

  function toggleFriend(username: string) {
    setSelectedFriends((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    );
  }

  function handleCreate() {
    if (!title.trim() || selectedFriends.length === 0) return;
    alert("Forum created (Supabase wiring coming next).");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-comic text-3xl text-ink">Start RPG forum</h1>

      <div className="comic-panel p-5 space-y-4">
        <div>
          <label className="font-comic text-sm block mb-1">Story / book title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-2 border-ink px-3 py-2 text-sm bg-surface"
            placeholder="The Hollow Gate"
          />
        </div>
        <div>
          <label className="font-comic text-sm block mb-1">Book cover URL (recommended)</label>
          <input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            className="w-full border-2 border-ink px-3 py-2 text-sm bg-surface"
          />
        </div>

        <div>
          <label className="font-comic text-sm block mb-1">Invite friends</label>
          <input
            value={friendQuery}
            onChange={(e) => setFriendQuery(e.target.value)}
            placeholder="Search by name…"
            className="w-full border-2 border-ink px-3 py-2 text-sm bg-surface mb-2"
          />
          <div className="flex flex-wrap gap-2">
            {filteredFriends.map((f) => (
              <button
                key={f.username}
                type="button"
                onClick={() => toggleFriend(f.username)}
                className={`font-comic text-xs px-3 py-1 border-2 border-ink ${
                  selectedFriends.includes(f.username)
                    ? "bg-comic-red text-white"
                    : "bg-surface"
                }`}
              >
                {f.display_name}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t-2 border-dashed border-ink pt-4">
          <label className="font-comic text-sm block mb-2">Chapter 1</label>
          <input
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            className="w-full border-2 border-ink px-3 py-2 text-sm bg-surface mb-3"
          />
          <div className="grid grid-cols-2 gap-2">
            {(["when", "era", "season", "location"] as const).map((key) => (
              <input
                key={key}
                value={meta[key]}
                onChange={(e) => setMeta({ ...meta, [key]: e.target.value })}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                className="border-2 border-ink px-2 py-1.5 text-xs bg-surface"
              />
            ))}
          </div>
          <ForumMetaLine meta={meta} />
        </div>

        <div>
          <label className="font-comic text-sm block mb-1">Opening post</label>
          <textarea
            value={firstPost}
            onChange={(e) => setFirstPost(e.target.value)}
            rows={5}
            className="w-full border-2 border-ink px-3 py-2 text-sm bg-surface"
            placeholder="Set the scene for your friends…"
          />
        </div>

        <Button variant="comic" onClick={handleCreate}>
          Create forum &amp; chapter 1
        </Button>
      </div>
    </div>
  );
}

export function ForumDetail({ forumId }: { forumId: string }) {
  const { isLoggedIn, loading } = useAuth();
  const forum = MOCK_FORUMS.find((f) => f.id === forumId);
  const [activeChapter, setActiveChapter] = useState(0);

  if (loading) return null;
  if (!isLoggedIn) return <LoginCTA message="Log in to read and write in this forum." />;
  if (!forum) return <p className="font-comic text-center">Forum not found.</p>;

  const chapter = forum.chapters[activeChapter];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/forum" className="text-sm font-comic text-comic-red hover:underline">
        ← Back to forums
      </Link>

      <div className="flex gap-4 items-start">
        {forum.book_cover_url && (
          <div className="comic-cover shrink-0">
            <Image src={forum.book_cover_url} alt="" width={100} height={140} unoptimized />
          </div>
        )}
        <div>
          <h1 className="font-comic text-3xl text-ink">{forum.title}</h1>
          <p className="text-xs text-ink-muted mt-1">With: {forum.members.join(", ")}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {forum.chapters.map((ch, i) => (
          <button
            key={ch.number}
            type="button"
            onClick={() => setActiveChapter(i)}
            className={`font-comic text-xs px-3 py-1 border-2 border-ink ${
              activeChapter === i ? "bg-comic-yellow" : "bg-surface"
            }`}
          >
            Ch. {ch.number}: {ch.title}
          </button>
        ))}
        <Link href="/forum/new">
          <Badge variant="tag">+ New chapter</Badge>
        </Link>
      </div>

      <div className="comic-panel p-5 space-y-4">
        <h2 className="font-comic text-xl">
          Chapter {chapter.number} — {chapter.title}
        </h2>
        {chapter.posts.map((post) => (
          <div key={post.id} className="border-l-4 border-comic-red pl-4">
            <p className="font-comic text-xs text-comic-red">@{post.author_username}</p>
            <p className="text-sm mt-1 leading-relaxed">{post.body}</p>
          </div>
        ))}
        <ForumMetaLine meta={chapter.meta} />
      </div>

      <textarea
        rows={3}
        placeholder="Write your reply…"
        className="w-full border-2 border-ink px-3 py-2 text-sm bg-surface"
      />
      <Button variant="comic">Post reply</Button>
    </div>
  );
}
