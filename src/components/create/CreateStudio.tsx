"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { addPost } from "@/lib/posts-store";
import { initialModerationStatus } from "@/lib/moderation";
import { CoverImageField } from "@/components/create/CoverImageField";
import { PricingFields } from "@/components/create/PricingFields";
import { WritingTagPicker } from "@/components/create/WritingTagPicker";
import { isValidCoverSource } from "@/lib/post-cover";
import { inferWritingPostType } from "@/lib/writing-tags";
import type { PricingType } from "@/types/database";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Code2, PenLine } from "lucide-react";

const CodePlayground = dynamic(
  () => import("@/components/editor/CodePlayground").then((m) => m.CodePlayground),
  { ssr: false, loading: () => <div className="comic-panel p-8 text-center font-comic">Loading forge…</div> }
);

type CreateMode = "writing" | "code";

export function CreateStudio() {
  const { isLoggedIn, loading } = useAuth();
  const identity = useActingIdentity();
  const router = useRouter();
  const [mode, setMode] = useState<CreateMode>("writing");
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [body, setBody] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [writingTags, setWritingTags] = useState<string[]>(["writing"]);
  const [pricing, setPricing] = useState<PricingType>("free");
  const [priceCents, setPriceCents] = useState(499);
  const [publishNote, setPublishNote] = useState<string | null>(null);

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

  function handlePublishWriting() {
    if (!title.trim() || !synopsis.trim()) return;
    if (writingTags.length === 0) {
      alert("Add at least one tag — poem, RPG, letters, story, etc. — so readers can find your work in Explore.");
      return;
    }
    if (!isValidCoverSource(coverUrl)) {
      alert("Add a cover image — upload a file or paste an image URL.");
      return;
    }
    if (!identity?.profile) {
      alert("Could not resolve creator identity. If you are admin, pick a creator in the header.");
      return;
    }

    const moderation = initialModerationStatus(pricing);
    const postType = inferWritingPostType(writingTags);

    let post;
    try {
      post = addPost({
      author_id: identity.authorId,
      author: identity.profile,
      type: postType,
      title: title.trim(),
      description: synopsis.trim(),
      plot_synopsis: synopsis.trim(),
      content: body.trim() || null,
      html_code: null,
      css_code: null,
      js_code: null,
      bbcode: null,
      preview_image_url: null,
      book_cover_url: coverUrl.trim(),
      invite_token: null,
      pricing,
      price_cents: pricing === "free" ? 0 : priceCents,
      is_code_locked: false,
      moderation_status: moderation,
      is_ai_generated: false,
      tags: writingTags,
      style_tags: [],
    });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not publish your writing.");
      return;
    }

    if (moderation === "pending") {
      setPublishNote(
        "Submitted for editor review. Your paid listing will appear in the Shop once approved."
      );
      router.push(`/post/${post.id}`);
      return;
    }

    router.push(`/post/${post.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-comic text-3xl text-ink">Creation Studio</h1>
        <p className="text-sm text-ink-muted mt-1">
          Publish code templates or any kind of writing — poems, letters, RPG chapters, and more.
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
            { id: "writing" as const, label: "Writing", icon: PenLine },
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

      <PricingFields
        pricing={pricing}
        priceCents={priceCents}
        onPricingChange={setPricing}
        onPriceCentsChange={setPriceCents}
      />

      {publishNote && (
        <p className="comic-panel px-4 py-3 text-sm text-ink bg-comic-yellow/50 border-2 border-ink">
          {publishNote}
        </p>
      )}

      {mode === "code" && (
        <CodePlayground
          loggedIn
          pricing={pricing}
          priceCents={priceCents}
          onPublished={({ pending, postId }) => {
            if (pending) {
              setPublishNote(
                "Submitted for editor review. Your paid template will appear in the Shop once approved."
              );
            }
            router.push(`/post/${postId}`);
            router.refresh();
          }}
        />
      )}

      {mode === "writing" && (
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
              Teaser / synopsis
            </label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              rows={3}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm italic"
              placeholder="What readers see before they open the full piece…"
            />
          </div>
          <WritingTagPicker value={writingTags} onChange={setWritingTags} />
          <CoverImageField
            value={coverUrl}
            onChange={setCoverUrl}
            required
            label="Cover image"
            hint="Required for Explore — paid listings also need a cover before they appear in the Shop."
            placeholder="https://…/cover.jpg"
          />
          <div>
            <label className="block text-sm font-comic text-ink mb-1">Full text</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm leading-relaxed"
              placeholder="Your poem, letter, chapter, or prose…"
            />
          </div>
          <Button variant="comic" onClick={handlePublishWriting}>
            Publish writing
          </Button>
        </Card>
      )}
    </div>
  );
}
