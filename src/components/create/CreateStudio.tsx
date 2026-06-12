"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { liveSyncErrorMessage, syncCreationLive } from "@/lib/live-content-sync";
import { addPost, getPostFromStore } from "@/lib/posts-store";
import { initialModerationStatus } from "@/lib/moderation";
import { CoverImageField } from "@/components/create/CoverImageField";
import { PricingFields } from "@/components/create/PricingFields";
import { WritingRichEditor } from "@/components/create/WritingRichEditor";
import { WritingTagPicker } from "@/components/create/WritingTagPicker";
import { normalizeWritingBody } from "@/lib/writing-content";
import { isValidCoverSource } from "@/lib/post-cover";
import {
  countSynopsisWords,
  SYNOPSIS_MAX_WORDS,
  synopsisExceedsWordLimit,
} from "@/lib/synopsis-text";
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
  const [syncError, setSyncError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function finishLivePublish(postId: string) {
    const saved = getPostFromStore(postId);
    if (!saved) return;

    setSaving(true);
    setSyncError(null);

    const result = await syncCreationLive(saved);
    const message = liveSyncErrorMessage(result);
    setSaving(false);

    if (message) {
      setSyncError(
        `${message} Add SUPABASE_SERVICE_ROLE_KEY on Netlify, run migrations 005 and 006, then publish again while logged in on the live site.`
      );
      return;
    }

    router.push(`/post/${postId}`);
    router.refresh();
  }

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

  async function handlePublishWriting() {
    if (!title.trim() || !synopsis.trim()) return;
    if (synopsisExceedsWordLimit(synopsis)) {
      alert(`Teaser / synopsis must be ${SYNOPSIS_MAX_WORDS} words or fewer for the back cover.`);
      return;
    }
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
      content: normalizeWritingBody(body),
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
    }

    await finishLivePublish(post.id);
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

      {syncError && (
        <p className="comic-panel px-4 py-3 text-sm text-ink bg-comic-red/10 border-2 border-comic-red">
          {syncError}
        </p>
      )}

      {saving && (
        <p className="comic-panel px-4 py-3 text-sm font-comic text-ink bg-comic-yellow/50 border-2 border-ink">
          Syncing to live server…
        </p>
      )}

      {mode === "code" && (
        <CodePlayground
          loggedIn
          pricing={pricing}
          priceCents={priceCents}
          onPublished={async ({ pending, postId }) => {
            if (pending) {
              setPublishNote(
                "Submitted for editor review. Your paid template will appear in the Shop once approved."
              );
            }
            await finishLivePublish(postId);
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
              placeholder="What readers see on the back cover before they open the full piece…"
            />
            <p
              className={`text-xs mt-1 font-comic ${
                synopsisExceedsWordLimit(synopsis) ? "text-comic-red" : "text-ink-muted"
              }`}
            >
              {countSynopsisWords(synopsis)} / {SYNOPSIS_MAX_WORDS} words (back cover teaser)
            </p>
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
            <p className="text-xs text-ink-muted mb-2">
              Bold, italic, underline, headings, alignment, font, and size — like a simple word processor.
            </p>
            <WritingRichEditor value={body} onChange={setBody} />
          </div>
          <Button variant="comic" onClick={handlePublishWriting}>
            Publish writing
          </Button>
        </Card>
      )}
    </div>
  );
}
