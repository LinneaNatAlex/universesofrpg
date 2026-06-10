"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetTeaserPreviewProps {
  src: string;
  alt: string;
  /** Logged in or invite — show full image */
  fullAccess: boolean;
  compact?: boolean;
  hint?: string;
  className?: string;
}

export function AssetTeaserPreview({
  src,
  alt,
  fullAccess,
  compact = false,
  hint,
  className,
}: AssetTeaserPreviewProps) {
  if (fullAccess) {
    return (
      <div className={cn("comic-panel p-1.5 w-full", className)}>
        <Image
          src={src}
          alt={alt}
          width={compact ? 400 : 480}
          height={compact ? 400 : 480}
          className="w-full h-auto object-cover"
          unoptimized
        />
      </div>
    );
  }

  const heightClass = compact ? "h-44" : "h-64 md:h-80";

  return (
    <div
      className={cn(
        "relative comic-panel overflow-hidden select-none asset-teaser-guard",
        heightClass,
        className
      )}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes={compact ? "400px" : "600px"}
        className="object-cover blur-[10px] scale-110 brightness-[0.82] saturate-[0.65] pointer-events-none"
        draggable={false}
        unoptimized
      />

      <div className="asset-teaser-watermark absolute inset-0 pointer-events-none" aria-hidden />

      <div className="absolute inset-0 bg-ink/30 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <Lock className="h-6 w-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        <p className="font-comic text-sm text-white uppercase tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          Preview only
        </p>
        {hint && (
          <p className="text-xs text-white/95 max-w-[220px] leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            {hint}
          </p>
        )}
        <Link
          href="/login"
          className="mt-1 inline-flex items-center gap-1 font-comic text-xs text-comic-yellow hover:underline drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
        >
          <Eye className="h-3.5 w-3.5" />
          Sign in for full pack
        </Link>
      </div>
    </div>
  );
}
