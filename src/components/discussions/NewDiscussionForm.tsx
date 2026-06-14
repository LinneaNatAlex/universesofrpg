"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useAuth } from "@/hooks/useAuth";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { Button } from "@/components/ui/button";
import {
  DISCUSSION_CATEGORIES,
  DISCUSSION_TAG_SUGGESTIONS,
  MAX_DISCUSSION_TAGS,
  normalizeDiscussionTagList,
} from "@/lib/discussion-tags";
import { createDiscussionThread } from "@/lib/discussions-store";
import {
  scheduleDiscussionLiveSync,
} from "@/lib/live-content-sync";

export function NewDiscussionForm() {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();
  const identity = useActingIdentity();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="comic-panel p-8 text-center font-comic text-ink-muted">Loading…</div>
    );
  }

  if (!isLoggedIn || !identity) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="font-comic text-2xl text-ink text-center">New discussion</h1>
        <LoginCTA message="Sign in to start a forum discussion." />
      </div>
    );
  }

  function addTag(raw: string) {
    const next = normalizeDiscussionTagList([...tags, raw]);
    setTags(next);
    setTagInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || title.trim().length < 4) {
      setError("Give your discussion a clear title (at least a few characters).");
      return;
    }
    if (!body.trim() || body.trim().length < 20) {
      setError("Write a bit more in the opening post so people know what to discuss.");
      return;
    }
    if (!identity) return;

    setSubmitting(false);
    const thread = createDiscussionThread({
      title: title.trim(),
      body: body.trim(),
      author_username: identity.username,
      author_display_name: identity.displayName,
      category,
      tags,
    });

    scheduleDiscussionLiveSync(() => {
      router.push(`/discussions/${thread.id}`);
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/discussions"
        className="inline-flex items-center gap-1 text-sm font-comic text-ink-muted hover:text-comic-red"
      >
        <ArrowLeft className="h-4 w-4" /> Forum discussions
      </Link>

      <header>
        <h1 className="font-comic text-3xl text-ink">New discussion</h1>
        <p className="text-sm text-ink-muted mt-1">
          Start a community thread — not an RPG story topic.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="comic-panel p-5 space-y-4">
        <div>
          <label className="font-comic text-sm block mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
            placeholder="What's on your mind?"
          />
        </div>

        <div>
          <label className="font-comic text-sm block mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm font-comic"
          >
            {DISCUSSION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-comic text-sm block mb-1">Opening post</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
            placeholder="Explain the topic, ask your question, or share context…"
          />
        </div>

        <div>
          <label className="font-comic text-sm block mb-1">
            Tags <span className="text-ink-muted font-normal">(up to {MAX_DISCUSSION_TAGS})</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                className="text-xs font-comic px-2 py-0.5 border border-ink bg-comic-yellow"
              >
                #{tag} ×
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (tagInput.trim()) addTag(tagInput.trim());
                }
              }}
              className="flex-1 border-2 border-ink bg-surface px-3 py-2 text-sm"
              placeholder="Add a tag and press Enter"
              disabled={tags.length >= MAX_DISCUSSION_TAGS}
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {DISCUSSION_TAG_SUGGESTIONS.filter((s) => !tags.includes(s))
              .slice(0, 8)
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTag(s)}
                  disabled={tags.length >= MAX_DISCUSSION_TAGS}
                  className="text-[10px] font-comic px-1.5 py-0.5 border border-dashed border-ink text-ink-muted hover:text-ink"
                >
                  +{s}
                </button>
              ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-comic-red bg-comic-red/10 border border-comic-red px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" variant="comic" disabled={submitting}>
          {submitting ? "Syncing to live server…" : "Publish discussion"}
        </Button>
      </form>
    </div>
  );
}
