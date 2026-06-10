"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { addPost } from "@/lib/posts-store";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Code2, PenLine, BookOpen } from "lucide-react";

const CodePlayground = dynamic(
  () => import("@/components/editor/CodePlayground").then((m) => m.CodePlayground),
  { ssr: false, loading: () => <div className="comic-panel p-8 text-center font-comic">Loading forge…</div> }
);

type CreateMode = "code" | "text" | "story";

export function CreateStudio() {
  const { isLoggedIn, loading } = useAuth();
  const identity = useActingIdentity();
  const router = useRouter();
  const [mode, setMode] = useState<CreateMode>("text");
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [body, setBody] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  if (loading) {
    return <div className="comic-panel p-8 text-center font-comic">Loading…</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="font-comic text-3xl text-ink text-center">Create</h1>
        <p className="text-center text-sm text-ink-muted">
          You must be logged in to publish code, stories, or forum posts.
        </p>
        <LoginCTA message="Sign in or create an account to start creating." />
      </div>
    );
  }

  function handlePublishText() {
    if (!title.trim() || !synopsis.trim()) return;
    if (!identity?.profile) {
      alert("Could not resolve creator identity. If you are admin, pick a creator in the header.");
      return;
    }

    addPost({
      author_id: identity.authorId,
      author: identity.profile,
      type: mode === "story" ? "story_segment" : "text_writing",
      title: title.trim(),
      description: synopsis.trim(),
      plot_synopsis: synopsis.trim(),
      content: body.trim() || null,
      html_code: null,
      css_code: null,
      js_code: null,
      bbcode: null,
      preview_image_url: null,
      book_cover_url: coverUrl.trim() || null,
      invite_token: null,
      pricing: "free",
      price_cents: 0,
      is_code_locked: false,
      moderation_status: "approved",
      is_ai_generated: false,
      tags: mode === "story" ? ["story"] : ["writing"],
      style_tags: [],
    });

    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-comic text-3xl text-ink">Creation Studio</h1>
        <p className="text-sm text-ink-muted mt-1">
          Publish code templates, writings, or story chapters.
        </p>
        {identity?.isActingAsPersona && (
          <p className="text-xs font-comic text-comic-red mt-2">
            Publishing as @{identity.username}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "text" as const, label: "Writing", icon: PenLine },
            { id: "story" as const, label: "Story / RPG", icon: BookOpen },
            { id: "code" as const, label: "Code template", icon: Code2 },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`flex items-center gap-2 px-4 py-2 font-comic text-sm border-2 border-ink ${
              mode === id
                ? "bg-comic-red text-white shadow-[2px_2px_0_#1a1a2e]"
                : "bg-surface text-ink hover:bg-comic-yellow"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {mode === "code" && <CodePlayground loggedIn />}

      {(mode === "text" || mode === "story") && (
        <Card className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-comic text-ink mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
              placeholder="Letters from the Ashwood"
            />
          </div>
          <div>
            <label className="block text-sm font-comic text-ink mb-1">
              Plot synopsis (back-of-book teaser)
            </label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              rows={3}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm italic"
              placeholder="What readers see before they sign up…"
            />
          </div>
          <div>
            <label className="block text-sm font-comic text-ink mb-1">
              Book cover URL (recommended)
            </label>
            <input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="block text-sm font-comic text-ink mb-1">Full text</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm leading-relaxed"
              placeholder="Write your chapter…"
            />
          </div>
          <Button variant="comic" onClick={handlePublishText}>
            Publish {mode === "story" ? "story" : "writing"}
          </Button>
        </Card>
      )}
    </div>
  );
}
