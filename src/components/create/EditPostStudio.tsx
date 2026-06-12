"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { usePost } from "@/hooks/usePost";
import { liveSyncErrorMessage, syncCreationLive } from "@/lib/live-content-sync";
import { updatePost } from "@/lib/posts-store";
import { canEditPost, getPostForEditing } from "@/lib/posts";
import { getVaultedCode, type PostCodeBundle } from "@/lib/post-code-vault";
import { fetchPostSourceCode } from "@/lib/post-source-code-client";
import { isValidCoverSource } from "@/lib/post-cover";
import {
  countSynopsisWords,
  SYNOPSIS_MAX_WORDS,
  synopsisExceedsWordLimit,
} from "@/lib/synopsis-text";
import { inferWritingPostType } from "@/lib/writing-tags";
import { extractThemeMusicUrl, stripThemeMusic } from "@/lib/template-preview";
import { CoverImageField } from "@/components/create/CoverImageField";
import { PricingFields } from "@/components/create/PricingFields";
import { WritingRichEditor } from "@/components/create/WritingRichEditor";
import { WritingTagPicker } from "@/components/create/WritingTagPicker";
import { normalizeWritingBody, plainTextToWritingHtml } from "@/lib/writing-content";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CodePlaygroundInitialValues } from "@/components/editor/CodePlayground";
import type { PricingType } from "@/types/database";
import { ArrowLeft } from "lucide-react";

const CodePlayground = dynamic(
  () => import("@/components/editor/CodePlayground").then((m) => m.CodePlayground),
  { ssr: false, loading: () => <div className="comic-panel p-8 text-center font-comic">Loading forge…</div> }
);

interface EditPostStudioProps {
  postId: string;
}

export function EditPostStudio({ postId }: EditPostStudioProps) {
  const { isLoggedIn, loading } = useAuth();
  const identity = useActingIdentity();
  const router = useRouter();
  const post = usePost(postId);
  const [sourceReady, setSourceReady] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [remoteBundle, setRemoteBundle] = useState<PostCodeBundle | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const editable = useMemo(() => {
    if (!post) return undefined;
    return getPostForEditing(post.id);
  }, [post]);

  const canEdit = post && identity ? canEditPost(post, identity.username) : false;

  useEffect(() => {
    if (!post || !canEdit || post.type !== "code_template") {
      setSourceReady(true);
      return;
    }

    const local = getVaultedCode(post.id);
    if (local?.html_code?.trim()) {
      setSourceReady(true);
      return;
    }

    let cancelled = false;
    setSourceReady(false);
    setSourceError(null);

    void fetchPostSourceCode(post.id).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setRemoteBundle(result.bundle);
        setSourceReady(true);
        return;
      }
      if (editable?.html_code?.trim() && editable.css_code?.trim()) {
        setSourceReady(true);
        return;
      }
      setSourceError(result.error);
      setSourceReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [post, canEdit, editable?.html_code, editable?.css_code]);

  const codeInitialValues = useMemo((): CodePlaygroundInitialValues | undefined => {
    if (!editable || editable.type !== "code_template") return undefined;
    const latest = getPostForEditing(editable.id) ?? editable;
    const vaulted = getVaultedCode(editable.id) ?? remoteBundle;
    const rawHtml = vaulted?.html_code ?? latest.html_code ?? "";
    const css = vaulted?.css_code ?? latest.css_code ?? "";
    const js = vaulted?.js_code ?? latest.js_code ?? "";
    return {
      title: latest.title,
      description: latest.description ?? "",
      html: stripThemeMusic(rawHtml),
      css,
      js,
      coverUrl: latest.preview_image_url ?? "",
      musicUrl: extractThemeMusicUrl(rawHtml),
      codeLocked: latest.is_code_locked,
    };
  }, [editable, sourceReady, remoteBundle]);

  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [body, setBody] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [writingTags, setWritingTags] = useState<string[]>(["writing"]);
  const [pricing, setPricing] = useState<PricingType>("free");
  const [priceCents, setPriceCents] = useState(499);
  const [writingLoaded, setWritingLoaded] = useState(false);

  useEffect(() => {
    if (!editable) return;
    setPricing(editable.pricing);
    setPriceCents(editable.price_cents || 499);
    if (editable.type === "code_template" || writingLoaded) return;
    setTitle(editable.title);
    setSynopsis(editable.plot_synopsis ?? editable.description ?? "");
    setBody(plainTextToWritingHtml(editable.content ?? ""));
    setCoverUrl(editable.book_cover_url ?? "");
    setWritingTags(editable.tags.length > 0 ? editable.tags : ["writing"]);
    setWritingLoaded(true);
  }, [editable, writingLoaded]);

  if (loading || post === undefined) {
    return <div className="comic-panel p-8 text-center font-comic">Loading…</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="font-comic text-3xl text-ink text-center">Edit creation</h1>
        <LoginCTA message="Sign in to edit your creations." />
      </div>
    );
  }

  if (post === null || !canEdit) {
    return (
      <div className="comic-panel p-8 text-center space-y-3">
        <h1 className="font-comic text-xl text-ink">Cannot edit this post</h1>
        <p className="text-sm text-ink-muted">
          You can only edit creations published under your current persona.
        </p>
        <Link href="/explore" className="font-comic text-comic-red hover:underline text-sm">
          ← Back to Explore
        </Link>
      </div>
    );
  }

  async function finishLiveSave(savedPost: typeof post) {
    if (!savedPost) return;
    setSaving(true);
    setSyncError(null);

    const result = await syncCreationLive(savedPost);
    const message = liveSyncErrorMessage(result);
    setSaving(false);

    if (message) {
      setSyncError(
        `${message} Add SUPABASE_SERVICE_ROLE_KEY on Netlify, run migrations 005 and 006, then save again while logged in on the live site.`
      );
      return;
    }

    router.push(`/post/${savedPost.id}`);
    router.refresh();
  }

  async function handleSaveWriting() {
    if (!title.trim() || !synopsis.trim()) return;
    if (synopsisExceedsWordLimit(synopsis)) {
      alert(`Teaser / synopsis must be ${SYNOPSIS_MAX_WORDS} words or fewer for the back cover.`);
      return;
    }
    if (writingTags.length === 0) {
      alert("Add at least one tag so readers can find your work.");
      return;
    }
    if (!isValidCoverSource(coverUrl)) {
      alert("Add a cover image — upload a file or paste an image URL.");
      return;
    }

    if (!post) return;

    try {
      updatePost(post.id, {
        title: title.trim(),
        description: synopsis.trim(),
        plot_synopsis: synopsis.trim(),
        content: normalizeWritingBody(body),
        book_cover_url: coverUrl.trim(),
        type: inferWritingPostType(writingTags),
        pricing,
        price_cents: pricing === "free" ? 0 : priceCents,
        tags: writingTags,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save your writing.");
      return;
    }

    await finishLiveSave(getPostForEditing(post.id) ?? post);
  }

  const isCode = post.type === "code_template";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/post/${post.id}`}
          className="inline-flex items-center gap-1 text-sm font-comic text-comic-red hover:underline mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to post
        </Link>
        <h1 className="font-comic text-3xl text-ink">Edit creation</h1>
        <p className="text-sm text-ink-muted mt-1">
          Update your {isCode ? "code template" : "writing"} and save — paid templates also sync
          source code to the server for buyers.
        </p>
        {identity?.isActingAsPersona && (
          <p className="text-xs font-comic text-comic-red mt-2">
            Editing as @{identity.username}
          </p>
        )}
      </div>

      <PricingFields
        pricing={pricing}
        priceCents={priceCents}
        onPricingChange={setPricing}
        onPriceCentsChange={setPriceCents}
      />

      {syncError && (
        <p className="comic-panel px-4 py-3 text-sm text-ink bg-comic-red/10 border-2 border-comic-red">
          {syncError}
        </p>
      )}

      {sourceError && isCode && (
        <p className="comic-panel px-4 py-3 text-sm text-ink bg-comic-yellow/50 border-2 border-ink">
          Could not load saved source from the server ({sourceError}). You can still edit from
          preview fields — save once to sync full code for buyers.
        </p>
      )}

      {saving && (
        <p className="comic-panel px-4 py-3 text-sm font-comic text-ink bg-comic-yellow/50 border-2 border-ink">
          Syncing to live server…
        </p>
      )}

      {isCode ? (
        sourceReady && codeInitialValues ? (
          <CodePlayground
            loggedIn
            pricing={pricing}
            priceCents={priceCents}
            editPostId={post.id}
            initialValues={codeInitialValues}
            onPublished={async () => {
              const saved = getPostForEditing(post.id) ?? post;
              await finishLiveSave(saved);
            }}
          />
        ) : (
          <div className="comic-panel p-8 text-center font-comic">Loading template source…</div>
        )
      ) : (
        <Card className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-comic text-ink mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-comic text-ink mb-1">Teaser / synopsis</label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              rows={3}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm italic"
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
            <WritingRichEditor value={body} onChange={setBody} />
          </div>
          <Button variant="comic" onClick={() => void handleSaveWriting()} disabled={saving}>
            {saving ? "Syncing…" : "Save changes"}
          </Button>
        </Card>
      )}
    </div>
  );
}
