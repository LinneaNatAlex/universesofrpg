import Image from "next/image";
import Link from "next/link";
import { BookOpen, Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookBackCoverProps {
  title: string;
  synopsis: string;
  coverUrl?: string | null;
  /** Main teaser art — shown beside the book cover when set. */
  previewImageUrl?: string | null;
  /** When false, preview art is blurred like other guest teasers. */
  previewFullAccess?: boolean;
  showCover?: boolean;
}

const ROW_HEIGHT = "h-44 sm:h-52 md:h-60";

function PreviewImageSlot({
  src,
  alt,
  fullAccess,
  hint,
}: {
  src: string;
  alt: string;
  fullAccess: boolean;
  hint?: string;
}) {
  if (fullAccess) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 55vw, 320px"
        className="object-cover object-center"
        unoptimized
      />
    );
  }

  return (
    <>
      <Image
        src={src}
        alt=""
        fill
        sizes="(max-width: 640px) 55vw, 320px"
        className="object-cover blur-[10px] scale-110 brightness-[0.82] saturate-[0.65] pointer-events-none"
        draggable={false}
        unoptimized
      />
      <div
        className="asset-teaser-watermark absolute inset-0 pointer-events-none"
        aria-hidden
      />
      <div className="absolute inset-0 bg-ink/30 flex flex-col items-center justify-center gap-1 p-2 text-center">
        <Lock className="h-5 w-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        <p className="font-comic text-[10px] sm:text-xs text-white uppercase tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          Preview
        </p>
        {hint && (
          <p className="text-[10px] text-white/95 leading-snug line-clamp-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            {hint}
          </p>
        )}
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-comic text-[10px] text-comic-yellow hover:underline drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
        >
          <Eye className="h-3 w-3" />
          Sign in
        </Link>
      </div>
    </>
  );
}

export function BookBackCover({
  title,
  synopsis,
  coverUrl,
  previewImageUrl,
  previewFullAccess = true,
  showCover = true,
}: BookBackCoverProps) {
  const body = synopsis.trim();
  const hasBookCover = Boolean(showCover && coverUrl);

  return (
    <div
      className={cn(
        "grid gap-2 sm:gap-3 items-stretch w-full",
        ROW_HEIGHT,
        hasBookCover && previewImageUrl
          ? "grid-cols-[4.25rem_minmax(0,2fr)_minmax(0,1fr)] sm:grid-cols-[7rem_minmax(0,2fr)_minmax(0,1fr)]"
          : previewImageUrl
            ? "grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
            : hasBookCover
              ? "grid-cols-[5.5rem_minmax(0,1fr)] sm:grid-cols-[8rem_minmax(0,1fr)]"
              : "grid-cols-1",
      )}
    >
      {hasBookCover && (
        <div className="comic-cover relative overflow-hidden bg-surface min-h-0 h-full">
          <Image
            src={coverUrl!}
            alt={`Cover of ${title}`}
            fill
            sizes="112px"
            className="object-cover object-center"
            unoptimized
          />
        </div>
      )}

      {previewImageUrl && (
        <div
          className={cn(
            "comic-cover relative overflow-hidden bg-surface min-h-0 h-full w-full select-none",
            !previewFullAccess && "asset-teaser-guard",
          )}
          onContextMenu={
            previewFullAccess ? undefined : (e) => e.preventDefault()
          }
        >
          <PreviewImageSlot
            src={previewImageUrl}
            alt={title}
            fullAccess={previewFullAccess}
            hint={body || undefined}
          />
        </div>
      )}

      <div className="comic-panel min-h-0 h-full overflow-hidden flex flex-col p-3 sm:p-4">
        <div className="shrink-0 flex items-center gap-2 mb-1.5 sm:mb-2">
          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-comic-red shrink-0" />
          <span className="font-comic text-[10px] sm:text-xs uppercase tracking-widest text-ink-muted">
            Back cover
          </span>
        </div>
        <h2 className="font-comic text-base sm:text-lg text-ink leading-tight shrink-0 line-clamp-2 mb-1.5">
          {title}
        </h2>
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none">
          <p className="text-xs sm:text-sm leading-relaxed text-ink-muted italic">
            {body || "Open to read the full story…"}
          </p>
        </div>
      </div>
    </div>
  );
}
