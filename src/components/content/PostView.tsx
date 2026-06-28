"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import {
  getEditorReviewConversationForPost,
  subscribeMessages,
} from "@/lib/messages-store";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { ReportDialog } from "@/components/reports/ReportDialog";
import { useEditor } from "@/hooks/useEditor";
import { useMarketplaceBuy } from "@/hooks/useMarketplaceBuy";
import { usePostSourceCode } from "@/hooks/usePostSourceCode";
import {
  canViewCodePreview,
  canViewFullContent,
  getCodeTemplatePreviewBundle,
  getLocalTemplateCodeBundle,
  requiresCodePurchase,
} from "@/lib/posts";
import {
  hydratePurchasesFromServer,
  PURCHASE_CONFIRMED_EVENT,
  type PurchaseConfirmedDetail,
  subscribePurchases,
} from "@/lib/purchases-store";
import {
  needsPurchaseToViewContent,
  verifyPurchaseAccess,
} from "@/lib/verify-marketplace-purchase";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ParentalPurchaseConsent } from "@/components/marketplace/ParentalPurchaseConsent";
import { moderationStatusLabel } from "@/lib/moderation";
import { canViewRatedContent, hasSexualContent } from "@/lib/content-rating";
import { MatureContentGate } from "@/components/content/MatureContentGate";
import { ContentRatingBadge } from "@/components/content/ContentRatingBadge";
import { useContentViewer } from "@/hooks/useContentViewer";
import { CodeSourcePanel } from "@/components/content/CodeSourcePanel";
import { TemplateReadmeBox } from "@/components/content/TemplateReadmeBox";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { BookBackCover } from "@/components/content/BookBackCover";
import { AssetTeaserPreview } from "@/components/content/AssetTeaserPreview";
import { LayoutPreview } from "@/components/content/LayoutPreview";
import { resolveThemeMusicUrl } from "@/lib/template-preview";
import { Badge } from "@/components/ui/badge";
import { CommentSection } from "@/components/comments/CommentSection";
import { WritingContentView } from "@/components/content/WritingContentView";
import { PostEngagementBar } from "@/components/feed/PostEngagementBar";
import { IllustrationGalleryView } from "@/components/content/IllustrationGalleryView";
import { getIllustrationImages } from "@/lib/illustrations";
import { getWritingCategoryLabel, getWritingTeaserLabel } from "@/lib/writing-categories";
import type { FeedPost } from "@/types/database";

interface PostViewProps {
  post: FeedPost;
}

function isStoryLike(type: FeedPost["type"]) {
  return (
    type === "story_segment" ||
    type === "text_writing" ||
    type === "character_sheet" ||
    type === "collab_thread"
  );
}

export function PostView({ post: rawPost }: PostViewProps) {
  const { isLoggedIn } = useAuth();
  const identity = useActingIdentity();
  const buyerUsername = identity?.username ?? null;
  const { isEditor } = useEditor();
  const [editorChatId, setEditorChatId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");

  const { ctx: ratingCtx } = useContentViewer();
  const ratingAllowed = canViewRatedContent(rawPost, ratingCtx);
  const loginAllowed = canViewFullContent(isLoggedIn, invite, rawPost.invite_token);
  const fullAccess = loginAllowed && ratingAllowed;
  const needsPurchase = needsPurchaseToViewContent(rawPost);
  const [contentUnlocked, setContentUnlocked] = useState(false);
  const { buy, busy: buyBusy, error: buyError, isMinor, missingAge } = useMarketplaceBuy();
  const [parentalConsent, setParentalConsent] = useState(false);
  const codeIsFree = rawPost.type === "code_template" && !requiresCodePurchase(rawPost);
  const paidCodeTemplate = rawPost.type === "code_template" && requiresCodePurchase(rawPost);
  const showCodeSection = canViewCodePreview(rawPost);
  const isAuthor =
    identity?.username.toLowerCase() === rawPost.author.username.toLowerCase();

  const viewer = useMemo(
    () => ({
      isLoggedIn,
      username: identity?.username ?? null,
      inviteToken: invite,
      isEditor,
    }),
    [isLoggedIn, identity?.username, invite, isEditor]
  );

  const refreshPurchaseAccess = useCallback(async () => {
    if (buyerUsername) {
      await hydratePurchasesFromServer(buyerUsername);
    }
    const next = await verifyPurchaseAccess(rawPost, viewer, buyerUsername);
    setContentUnlocked(next);
  }, [rawPost, viewer, buyerUsername]);

  useEffect(() => {
    void refreshPurchaseAccess();
    const unsub = subscribePurchases(() => {
      void refreshPurchaseAccess();
    });
    return unsub;
  }, [refreshPurchaseAccess]);

  useEffect(() => {
    function onPurchaseConfirmed(event: Event) {
      const detail = (event as CustomEvent<PurchaseConfirmedDetail>).detail;
      if (!detail || !buyerUsername) return;
      if (detail.postId !== rawPost.id) return;
      if (detail.username.toLowerCase() !== buyerUsername.toLowerCase()) return;
      setContentUnlocked(true);
      void refreshPurchaseAccess();
    }
    window.addEventListener(PURCHASE_CONFIRMED_EVENT, onPurchaseConfirmed);
    return () => window.removeEventListener(PURCHASE_CONFIRMED_EVENT, onPurchaseConfirmed);
  }, [rawPost.id, buyerUsername, refreshPurchaseAccess]);

  const canViewBody = needsPurchase ? contentUnlocked : fullAccess;
  const localTemplateBundle = useMemo(
    () => getLocalTemplateCodeBundle(rawPost.id),
    [rawPost.id, rawPost.updated_at]
  );
  const { bundle: purchasedSource } = usePostSourceCode(
    rawPost.id,
    paidCodeTemplate &&
      !isAuthor &&
      isLoggedIn &&
      Boolean(buyerUsername) &&
      contentUnlocked,
    buyerUsername,
    true
  );
  const previewBundle = useMemo(() => {
    if (rawPost.type !== "code_template") return null;
    if (needsPurchase && !contentUnlocked) return null;
    if (isAuthor) {
      return (
        localTemplateBundle ?? getCodeTemplatePreviewBundle(rawPost, viewer)
      );
    }
    if (paidCodeTemplate) {
      return purchasedSource ?? getCodeTemplatePreviewBundle(rawPost, viewer);
    }
    return getCodeTemplatePreviewBundle(rawPost, viewer);
  }, [
    rawPost,
    needsPurchase,
    contentUnlocked,
    isAuthor,
    localTemplateBundle,
    viewer,
    paidCodeTemplate,
    purchasedSource,
  ]);
  const hasPaidSource = Boolean(purchasedSource || (isAuthor && localTemplateBundle));
  const showLiveCodePreview = previewBundle !== null;
  const synopsis = rawPost.plot_synopsis ?? rawPost.description ?? "";
  const writingLabel = getWritingCategoryLabel(rawPost);
  const teaserLabel = getWritingTeaserLabel(rawPost);
  const illustrationImages = getIllustrationImages(rawPost);
  const typeBadgeLabel =
    writingLabel ??
    (rawPost.type === "digital_asset" ? "Illustration" : rawPost.type.replaceAll("_", " "));

  const accessMessage =
    rawPost.pricing === "free"
      ? "This work is free — join to unlock the full content."
      : "Purchase to read or download the full content.";

  async function handlePurchase() {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    const result = await buy(
      {
        post_id: rawPost.id,
        title: rawPost.title,
        price_cents: rawPost.price_cents,
        seller_username: rawPost.author.username,
      },
      parentalConsent
    );
    if (result === "unlocked") {
      void refreshPurchaseAccess();
    }
  }

  useEffect(() => {
    if (rawPost.moderation_status !== "pending") {
      setEditorChatId(null);
      return;
    }
    const refresh = () => {
      const conv = getEditorReviewConversationForPost(rawPost.id);
      setEditorChatId(conv?.id ?? null);
    };
    refresh();
    return subscribeMessages(refresh);
  }, [rawPost.id, rawPost.moderation_status]);

  if (hasSexualContent(rawPost) && !ratingAllowed) {
    return (
      <article className="space-y-6 mx-auto max-w-3xl">
        <header className="space-y-2 text-center">
          <Link
            href={`/profile/${rawPost.author.username}`}
            className="text-sm font-comic text-comic-red hover:underline"
          >
            @{rawPost.author.username}
          </Link>
          <h1 className="font-comic text-2xl sm:text-3xl text-ink leading-tight">
            {rawPost.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <ContentRatingBadge item={rawPost} />
          </div>
        </header>
        <MatureContentGate title={rawPost.title} backHref="/" backLabel="← Back to feed" />
      </article>
    );
  }

  return (
    <article
      className={`space-y-6 mx-auto ${
        rawPost.type === "code_template" ? "max-w-7xl" : "max-w-3xl"
      }`}
    >
      {rawPost.moderation_status === "pending" && (
        <div className="comic-panel px-4 py-2 text-xs font-comic text-comic-red text-center bg-comic-yellow/40 space-y-1">
          <p>
            {moderationStatusLabel(rawPost.moderation_status)} — visible to you and editors until
            approved.
          </p>
          {isAuthor && editorChatId && (
            <Link href={`/messages/${editorChatId}`} className="text-comic-red underline">
              Open editor chat about this listing →
            </Link>
          )}
        </div>
      )}
      {!fullAccess && !codeIsFree && (
        <p className="comic-panel px-4 py-2 text-xs font-comic text-ink-muted text-center">
          You&apos;re viewing a teaser. Sign up to unlock full content
          {rawPost.pricing !== "free" ? " (premium may require purchase)." : "."}
        </p>
      )}
      <header className="space-y-2">
        <Link
          href={`/profile/${rawPost.author.username}`}
          className="text-sm font-comic text-comic-red hover:underline"
        >
          @{rawPost.author.username}
        </Link>
        <h1 className="font-comic text-2xl sm:text-3xl md:text-4xl text-ink leading-tight">
          {rawPost.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="comic">{typeBadgeLabel}</Badge>
          {rawPost.pricing === "free" ? (
            <Badge variant="free">Free</Badge>
          ) : (
            <Badge variant="paid">Paid</Badge>
          )}
          <ContentRatingBadge item={rawPost} />
          {isLoggedIn && identity && (
            <ReportDialog
              targetType="post"
              reporterUsername={identity.username}
              reporterDisplayName={identity.displayName}
              postId={rawPost.id}
              postTitle={rawPost.title}
              label="Report post"
              className="ml-auto"
            />
          )}
        </div>
      </header>

      {/* Code templates — cover teaser until purchase; live preview + source after unlock */}
      {showCodeSection && (
        <section className="space-y-4">
          <TemplateReadmeBox post={rawPost} />
          <div>
            <p className="font-comic text-sm text-ink mb-2">
              {showLiveCodePreview ? "Live template preview" : "Template preview"}
            </p>
            {showLiveCodePreview && previewBundle ? (
              <LayoutPreview
                html={previewBundle.html_code}
                css={previewBundle.css_code}
                js={previewBundle.js_code}
                musicUrl={resolveThemeMusicUrl(
                  previewBundle.html_code,
                  rawPost.theme_music_url
                )}
                mode="full"
                height={240}
                sourceLocked={paidCodeTemplate && !hasPaidSource && !isAuthor}
                defaultViewport="desktop"
              />
            ) : rawPost.preview_image_url ? (
              <AssetTeaserPreview
                src={rawPost.preview_image_url}
                alt={rawPost.title}
                fullAccess={fullAccess}
                hint={
                  needsPurchase && !contentUnlocked
                    ? "Cover preview only — purchase to unlock the template."
                    : "Live template preview is not available for this listing yet."
                }
              />
            ) : null}
          </div>
          <div>
            <p className="font-comic text-sm text-ink mb-2">
              {codeIsFree ? "Source code — free to copy" : "Source code"}
            </p>
            <CodeSourcePanel post={rawPost} inviteToken={invite} />
          </div>
        </section>
      )}

      {/* Illustration packs — multi-image gallery */}
      {rawPost.type === "digital_asset" && (
        <section className="space-y-4">
          {(rawPost.plot_synopsis ?? rawPost.description) && (
            <p className="text-sm text-ink-muted italic leading-relaxed">
              {rawPost.plot_synopsis ?? rawPost.description}
            </p>
          )}
          <IllustrationGalleryView
            images={illustrationImages}
            title={rawPost.title}
            fullAccess={fullAccess}
          />
          {!fullAccess && <LoginCTA message={accessMessage} />}
        </section>
      )}

      {/* Single asset preview (non-illustration types with preview image) */}
      {rawPost.type !== "digital_asset" &&
        rawPost.preview_image_url &&
        !isStoryLike(rawPost.type) &&
        rawPost.type !== "code_template" && (
          <section className="space-y-3">
            <AssetTeaserPreview
              src={rawPost.preview_image_url}
              alt={rawPost.title}
              fullAccess={fullAccess}
            />
            {!fullAccess && <LoginCTA message={accessMessage} />}
          </section>
        )}

      {/* Story / text — back-of-book for guests */}
      {isStoryLike(rawPost.type) && (
        <section className="space-y-4">
          {rawPost.preview_image_url && (
            <div className="hidden md:block">
              <AssetTeaserPreview
                src={rawPost.preview_image_url}
                alt={rawPost.title}
                fullAccess={fullAccess}
              />
            </div>
          )}
          <BookBackCover
            title={rawPost.title}
            synopsis={synopsis}
            teaserLabel={teaserLabel}
            coverUrl={rawPost.book_cover_url}
            previewImageUrl={rawPost.preview_image_url}
            previewFullAccess={fullAccess}
          />
          {canViewBody ? (
            <div className="comic-panel p-6 prose-comic writing-content">
              <WritingContentView content={rawPost.content} />
              {rawPost.bbcode && (
                <p className="mt-4 text-sm text-ink-muted font-mono">{rawPost.bbcode}</p>
              )}
            </div>
          ) : needsPurchase && isLoggedIn ? (
            <div className="comic-panel p-6 space-y-4 text-center">
              <p className="text-sm text-ink-muted">
                The cover and synopsis are shown above. Purchase to read the full text.
              </p>
              {isMinor && (
                <ParentalPurchaseConsent
                  checked={parentalConsent}
                  onChange={setParentalConsent}
                />
              )}
              {missingAge && (
                <p className="text-xs text-ink-muted">
                  Purchases require age on your account.
                </p>
              )}
              <Button
                variant="comic"
                disabled={buyBusy || (isMinor && !parentalConsent)}
                onClick={() => void handlePurchase()}
              >
                <ShoppingBag className="h-4 w-4 mr-1.5" />
                {buyBusy ? "Opening checkout…" : `Buy for ${formatPrice(rawPost.price_cents)}`}
              </Button>
              {buyError && <p className="text-xs text-comic-red font-comic">{buyError}</p>}
            </div>
          ) : (
            <LoginCTA message={accessMessage} />
          )}
        </section>
      )}

      <div className="comic-panel px-4 py-3 flex items-center justify-between border-2 border-ink">
        <p className="text-xs font-comic text-ink-muted uppercase">Community</p>
        <PostEngagementBar
          postId={rawPost.id}
          likeCount={rawPost.like_count}
          isPaid={rawPost.pricing !== "free"}
        />
      </div>

      <div id="comments">
        <CommentSection postId={rawPost.id} />
      </div>
    </article>
  );
}
