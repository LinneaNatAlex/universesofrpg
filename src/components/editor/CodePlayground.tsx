"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { addPost, updatePost } from "@/lib/posts-store";
import { initialModerationStatus } from "@/lib/moderation";
import { injectThemeMusic } from "@/lib/template-preview";
import { LayoutPreview } from "@/components/content/LayoutPreview";
import { CoverImageField } from "@/components/create/CoverImageField";
import { isValidCoverSource } from "@/lib/post-cover";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PricingType } from "@/types/database";
import { Eye, Code2, Lock } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-ink-muted text-sm font-comic">
      Loading editor…
    </div>
  ),
});

type Tab = "html" | "css" | "js";

const DEFAULT_HTML = `<div class="hero">
  <h1>Lyra Moonwhisper</h1>
  <p class="class">Arcane Weaver · Level 42</p>
</div>`;

const DEFAULT_CSS = `.hero {
  padding: 2rem;
  border: 3px solid #e63946;
  background: #1d3557;
  color: #f1faee;
  font-family: Georgia, serif;
  text-align: center;
}
.class { color: #ffd60a; }`;

const DEFAULT_JS = `// Interactive RPG elements`;

export interface CodePlaygroundInitialValues {
  title: string;
  description: string;
  html: string;
  css: string;
  js: string;
  coverUrl: string;
  musicUrl?: string;
  codeLocked?: boolean;
}

interface CodePlaygroundProps {
  loggedIn?: boolean;
  pricing?: PricingType;
  priceCents?: number;
  editPostId?: string;
  initialValues?: CodePlaygroundInitialValues;
  onPublished?: (result: { pending: boolean; postId: string }) => void;
}

export function CodePlayground({
  loggedIn = false,
  pricing = "free",
  priceCents = 499,
  editPostId,
  initialValues,
  onPublished,
}: CodePlaygroundProps) {
  const identity = useActingIdentity();
  const isEditing = Boolean(editPostId);
  const [tab, setTab] = useState<Tab>("html");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);
  const [showPreview, setShowPreview] = useState(true);
  const [codeLocked, setCodeLocked] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  useEffect(() => {
    if (!initialValues) return;
    setTitle(initialValues.title);
    setDescription(initialValues.description);
    setHtml(initialValues.html || DEFAULT_HTML);
    setCss(initialValues.css || DEFAULT_CSS);
    setJs(initialValues.js || DEFAULT_JS);
    setCoverUrl(initialValues.coverUrl);
    setMusicUrl(initialValues.musicUrl ?? "");
    setCodeLocked(initialValues.codeLocked ?? false);
  }, [initialValues]);

  const previewHtml = injectThemeMusic(html, musicUrl);

  function handlePublish() {
    if (!title.trim()) {
      alert("Add a title before publishing.");
      return;
    }
    if (!identity?.profile) {
      alert("Could not resolve creator identity. If you are admin, pick a creator in the header.");
      return;
    }
    if (!isValidCoverSource(coverUrl)) {
      alert(
        "Add a cover image — upload a screenshot or paste an image URL for the Shop and Explore thumbnail."
      );
      return;
    }

    const moderation = initialModerationStatus(pricing);
    const payload = {
      type: "code_template" as const,
      title: title.trim(),
      description: description.trim() || "Code template",
      plot_synopsis: null,
      content: null,
      html_code: previewHtml,
      css_code: css,
      js_code: js,
      bbcode: null,
      preview_image_url: coverUrl.trim(),
      book_cover_url: null,
      invite_token: null,
      pricing,
      price_cents: pricing === "free" ? 0 : priceCents,
      is_code_locked: pricing !== "free" ? true : codeLocked,
      moderation_status: moderation,
      is_ai_generated: false,
      tags: ["profile", "code"],
      style_tags: [] as string[],
    };

    let postId: string;
    try {
      if (editPostId) {
        const { moderation_status: _ignored, ...editPayload } = payload;
        updatePost(editPostId, editPayload);
        postId = editPostId;
      } else {
        const post = addPost({
          ...payload,
          author_id: identity.authorId,
          author: identity.profile,
        });
        postId = post.id;
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : isEditing
            ? "Could not save your template."
            : "Could not publish your template."
      );
      return;
    }

    onPublished?.({ pending: moderation === "pending", postId });
  }

  const editorValue = tab === "html" ? html : tab === "css" ? css : js;
  const setEditorValue = (v: string) => {
    if (tab === "html") setHtml(v);
    else if (tab === "css") setCss(v);
    else setJs(v);
  };

  const language = tab === "js" ? "javascript" : tab;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-comic-red" />
          <h2 className="font-comic text-xl text-ink">Code Forge</h2>
        </div>
        {loggedIn && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCodeLocked(!codeLocked)}
            >
              <Lock className="h-4 w-4 mr-1" />
              {codeLocked ? "Pay to unlock" : "Code visible"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? "Hide preview" : "Show preview"}
            </Button>
            <Button variant="comic" size="sm" onClick={handlePublish}>
              {isEditing ? "Save changes" : "Publish template"}
            </Button>
          </div>
        )}
      </div>

      {loggedIn && (
        <Card className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-comic text-ink mb-1">Template title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
              placeholder="Neon Arcane Profile Theme"
            />
          </div>
          <div>
            <label className="block text-sm font-comic text-ink mb-1">Short description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
              placeholder="A glowing fantasy profile layout…"
            />
          </div>
          <CoverImageField
            value={coverUrl}
            onChange={setCoverUrl}
            required
            label="Cover image (screenshot)"
            hint="Screenshot your live template preview and upload it here, or paste a hosted image URL. Shown in Explore and the Shop."
            placeholder="https://…/template-screenshot.png"
          />
          <div>
            <label className="block text-sm font-comic text-ink mb-1">
              Theme music URL (optional)
            </label>
            <input
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
              placeholder="https://…/your-track.mp3"
            />
            <p className="text-xs text-ink-muted mt-1">
              Adds a play button inside the template preview. You can also embed{" "}
              <code className="font-mono">&lt;audio&gt;</code> in your HTML.
            </p>
          </div>
        </Card>
      )}

      <div className={`grid gap-4 ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        <Card className="overflow-hidden flex flex-col min-h-[480px]">
          <div className="flex border-b-2 border-ink">
            {(["html", "css", "js"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-mono uppercase ${
                  tab === t
                    ? "bg-comic-yellow text-ink border-b-2 border-comic-red -mb-0.5"
                    : "text-ink-muted hover:bg-surface"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-[400px]">
            <MonacoEditor
              language={language}
              value={editorValue}
              onChange={(v) => setEditorValue(v ?? "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                padding: { top: 12 },
                scrollBeyondLastLine: false,
                readOnly: !loggedIn,
              }}
            />
          </div>
        </Card>

        {showPreview && (
          <LayoutPreview
            html={previewHtml}
            css={css}
            js={js}
            mode="full"
            defaultViewport="desktop"
            className="min-h-[480px]"
          />
        )}
      </div>
    </div>
  );
}
