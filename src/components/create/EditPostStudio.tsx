"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { usePost } from "@/hooks/usePost";
import {
  publishCreationLive,
} from "@/lib/live-content-sync";
import { updatePost } from "@/lib/posts-store";
import { canEditPost, getLocalTemplateCodeBundle, getPostForEditing } from "@/lib/posts";
import type { PostCodeBundle } from "@/lib/post-code-vault";
import { fetchPostSourceCode } from "@/lib/post-source-code-client";
import { isValidCoverSource } from "@/lib/post-cover";
import {
  countSynopsisWords,
  SYNOPSIS_MAX_WORDS,
  synopsisExceedsWordLimit,
} from "@/lib/synopsis-text";
import { extractThemeMusicUrl, stripThemeMusic } from "@/lib/template-preview";
import { CoverImageField } from "@/components/create/CoverImageField";
import { PricingFields } from "@/components/create/PricingFields";
import { WritingRichEditor } from "@/components/create/WritingRichEditor";
import { IllustrationGalleryField } from "@/components/create/IllustrationGalleryField";
import { WritingCategoryPicker } from "@/components/create/WritingCategoryPicker";
import { WritingTagPicker } from "@/components/create/WritingTagPicker";
import { ILLUSTRATION_TAG_SUGGESTIONS } from "@/lib/illustration-tags";
import {
  getIllustrationCoverUrl,
  getIllustrationImages,
  normalizeIllustrationImages,
} from "@/lib/illustrations";
import { normalizeWritingBody, plainTextToWritingHtml } from "@/lib/writing-content";
import {
  getWritingCategoryMeta,
  inferWritingPostTypeForCategory,
  resolveWritingCategory,
  type WritingCategoryId,
} from "@/lib/writing-categories";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CodePlaygroundInitialValues } from "@/components/editor/CodePlayground";
import { ContentRatingDeclaration } from "@/components/content/ContentRatingDeclaration";
import type { PricingType } from "@/types/database";
import { ArrowLeft } from "lucide-react";

const CodePlayground = dynamic(
  () => import("@/components/editor/CodePlayground").then((m) => m.CodePlayground),
  { ssr: false, loading: () => <div className="comic-panel p-8 text-center font-comic">Loading forge…</div> }
);

interface EditPostStudioProps {
  postId: string;
}

function hasLocalTemplateSource(postId: string): boolean {
  return getLocalTemplateCodeBundle(postId) !== null;
}

export function EditPostStudio({ postId }: EditPostStudioProps) {
  const { isLoggedIn, loading } = useAuth();
  const identity = useActingIdentity();
  const router = useRouter();
  const post = usePost(postId);
  const [remoteLoaded, setRemoteLoaded] = useState(true);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [remoteBundle, setRemoteBundle] = useState<PostCodeBundle | null>(null);

  const editable = useMemo(() => {
    if (!post) return undefined;
    return getPostForEditing(post.id);
  }, [post]);

  const canEdit = post && identity ? canEditPost(post, identity.username) : false;

  useEffect(() => {
    if (!post || !canEdit || post.type !== "code_template") {
      setRemoteLoaded(true);
      return;
    }

    if (hasLocalTemplateSource(post.id)) {
      setRemoteLoaded(true);
      return;
    }

    let cancelled = false;
    setRemoteLoaded(false);
    setSourceError(null);

    void fetchPostSourceCode(post.id, identity?.username).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setRemoteBundle(result.bundle);
      } else if (!hasLocalTemplateSource(post.id)) {
        setSourceError(result.error);
      }
      setRemoteLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [post, canEdit, identity?.username]);

  const codeInitialValues = useMemo((): CodePlaygroundInitialValues | undefined => {
    if (!editable || editable.type !== "code_template") return undefined;
    const latest = getPostForEditing(editable.id) ?? editable;
    const local = getLocalTemplateCodeBundle(editable.id);
    const rawHtml =
      local?.html_code?.trim()
        ? local.html_code
        : (remoteBundle?.html_code ?? latest.html_code ?? "");
    const css =
      local?.css_code?.trim()
        ? local.css_code
        : (remoteBundle?.css_code ?? latest.css_code ?? "");
    const js =
      local?.js_code?.trim()
        ? local.js_code
        : (remoteBundle?.js_code ?? latest.js_code ?? "");
    return {
      title: latest.title,
      description: latest.description ?? "",
      html: stripThemeMusic(rawHtml),
      css,
      js,
      coverUrl: latest.preview_image_url ?? "",
      musicUrl: latest.theme_music_url ?? extractThemeMusicUrl(rawHtml),
      templateReadme: latest.template_readme ?? "",
      codeLocked: latest.is_code_locked,
      containsSexualContent: latest.contains_sexual_content ?? false,
    };
  }, [editable, remoteLoaded, remoteBundle, post?.updated_at]);

  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [body, setBody] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [writingCategory, setWritingCategory] = useState<WritingCategoryId>("book");
  const [writingTags, setWritingTags] = useState<string[]>(["writing"]);
  const [pricing, setPricing] = useState<PricingType>("free");
  const [priceCents, setPriceCents] = useState(499);
  const [writingLoaded, setWritingLoaded] = useState(false);
  const [illImages, setIllImages] = useState<string[]>([]);
  const [illTags, setIllTags] = useState<string[]>(["illustration"]);
  const [illustrationLoaded, setIllustrationLoaded] = useState(false);
  const [containsSexualContent, setContainsSexualContent] = useState(false);

  useEffect(() => {
    if (!editable) return;
    setPricing(editable.pricing);
    setPriceCents(editable.price_cents || 499);
    if (editable.type === "code_template") return;

    if (editable.type === "digital_asset") {
      if (illustrationLoaded) return;
      setTitle(editable.title);
      setSynopsis(editable.plot_synopsis ?? editable.description ?? "");
      setIllImages(getIllustrationImages(editable));
      setIllTags(editable.tags.length > 0 ? editable.tags : ["illustration"]);
      setIllustrationLoaded(true);
      setContainsSexualContent(editable.contains_sexual_content ?? false);
      return;
    }

    if (writingLoaded) return;
    setTitle(editable.title);
    setSynopsis(editable.plot_synopsis ?? editable.description ?? "");
    setBody(plainTextToWritingHtml(editable.content ?? ""));
    setCoverUrl(editable.book_cover_url ?? "");
    setWritingTags(editable.tags.length > 0 ? editable.tags : ["writing"]);
    setWritingCategory(resolveWritingCategory(editable));
    setWritingLoaded(true);
    setContainsSexualContent(editable.contains_sexual_content ?? false);
  }, [editable, writingLoaded, illustrationLoaded]);

  const categoryMeta = getWritingCategoryMeta(writingCategory);

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
    await publishCreationLive(savedPost.id, () => {
      router.push(`/post/${savedPost.id}`);
      router.refresh();
    });
  }

  async function handleSaveWriting() {
    if (!title.trim() || !synopsis.trim()) return;
    if (synopsisExceedsWordLimit(synopsis)) {
      alert(
        `Teaser / synopsis must be ${SYNOPSIS_MAX_WORDS} words or fewer for the ${categoryMeta.teaserLabel.toLowerCase()}.`
      );
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
        type: inferWritingPostTypeForCategory(writingCategory, writingTags),
        pricing,
        price_cents: pricing === "free" ? 0 : priceCents,
        tags: writingTags,
        writing_category: writingCategory,
        contains_sexual_content: containsSexualContent,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save your writing.");
      return;
    }

    finishLiveSave(getPostForEditing(post.id) ?? post);
  }

  async function handleSaveIllustrations() {
    const images = normalizeIllustrationImages(illImages);
    if (!title.trim() || !synopsis.trim()) return;
    if (images.length === 0) {
      alert("Add at least one illustration.");
      return;
    }
    if (illTags.length === 0) {
      alert("Add at least one tag so readers can find your work.");
      return;
    }
    if (!post) return;

    try {
      updatePost(post.id, {
        title: title.trim(),
        description: synopsis.trim(),
        plot_synopsis: synopsis.trim(),
        preview_image_url: getIllustrationCoverUrl(images),
        illustration_images: images,
        pricing,
        price_cents: pricing === "free" ? 0 : priceCents,
        tags: illTags,
        contains_sexual_content: containsSexualContent,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save your illustrations.");
      return;
    }

    finishLiveSave(getPostForEditing(post.id) ?? post);
  }

  const isCode = post.type === "code_template";
  const isIllustration = post.type === "digital_asset";

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
          Update your{" "}
          {isCode ? "code template" : isIllustration ? "illustration pack" : "writing"} and save
          {isCode ? " — paid templates also sync source code to the server for buyers." : "."}
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

      {!isCode && (
        <ContentRatingDeclaration
          containsSexualContent={containsSexualContent}
          onContainsSexualContentChange={setContainsSexualContent}
        />
      )}

      {sourceError && isCode && (
        <p className="comic-panel px-4 py-3 text-sm text-ink bg-comic-yellow/50 border-2 border-ink">
          Could not load saved source from the server ({sourceError}). You can still edit from
          preview fields — save once to sync full code for buyers.
        </p>
      )}

      {isCode ? (
        remoteLoaded && codeInitialValues ? (
          <CodePlayground
            key={`${post.id}-${post.updated_at ?? post.created_at}`}
            loggedIn
            pricing={pricing}
            priceCents={priceCents}
            editPostId={post.id}
            initialValues={codeInitialValues}
            containsSexualContent={containsSexualContent}
            onContainsSexualContentChange={setContainsSexualContent}
            onPublished={() => {
              const saved = getPostForEditing(post.id) ?? post;
              finishLiveSave(saved);
            }}
          />
        ) : (
          <div className="comic-panel p-8 text-center font-comic">Loading template source…</div>
        )
      ) : isIllustration ? (
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
            <label className="block text-sm font-comic text-ink mb-1">Description</label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              rows={3}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm italic"
            />
          </div>
          <IllustrationGalleryField value={illImages} onChange={setIllImages} />
          <WritingTagPicker
            value={illTags}
            onChange={setIllTags}
            suggestions={ILLUSTRATION_TAG_SUGGESTIONS}
            label="Tags"
            hint="Categorize your art — portrait, map, fantasy, token, and more."
          />
          <Button variant="comic" onClick={() => void handleSaveIllustrations()}>
            Save changes
          </Button>
        </Card>
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
          <WritingCategoryPicker value={writingCategory} onChange={setWritingCategory} />
          <div>
            <label className="block text-sm font-comic text-ink mb-1">Teaser / synopsis</label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              rows={3}
              className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm italic"
              placeholder={categoryMeta.synopsisHint}
            />
            <p
              className={`text-xs mt-1 font-comic ${
                synopsisExceedsWordLimit(synopsis) ? "text-comic-red" : "text-ink-muted"
              }`}
            >
              {countSynopsisWords(synopsis)} / {SYNOPSIS_MAX_WORDS} words ({categoryMeta.teaserLabel.toLowerCase()} teaser)
            </p>
          </div>
          <WritingTagPicker value={writingTags} onChange={setWritingTags} />
          <CoverImageField
            value={coverUrl}
            onChange={setCoverUrl}
            required
            label={categoryMeta.coverLabel}
            hint="Required for Explore — paid listings also need a cover before they appear in the Shop."
            placeholder="https://…/cover.jpg"
          />
          <div>
            <label className="block text-sm font-comic text-ink mb-1">Full text</label>
            <WritingRichEditor value={body} onChange={setBody} />
          </div>
          <Button variant="comic" onClick={() => void handleSaveWriting()}>
            Save changes
          </Button>
        </Card>
      )}
    </div>
  );
}
