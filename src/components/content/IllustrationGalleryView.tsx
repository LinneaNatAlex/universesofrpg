"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface IllustrationGalleryViewProps {
  images: string[];
  title: string;
  fullAccess: boolean;
  className?: string;
}

function GalleryImage({
  src,
  alt,
  fullAccess,
}: {
  src: string;
  alt: string;
  fullAccess: boolean;
}) {
  if (fullAccess) {
    return (
      <Image
        src={src}
        alt={alt}
        width={640}
        height={640}
        className="w-full h-auto object-contain bg-surface"
        unoptimized
      />
    );
  }

  return (
    <div className="relative asset-teaser-guard">
      <Image
        src={src}
        alt=""
        width={640}
        height={640}
        className="w-full h-auto object-cover blur-[10px] scale-110 brightness-[0.82] saturate-[0.65] pointer-events-none"
        draggable={false}
        unoptimized
      />
      <div className="asset-teaser-watermark absolute inset-0 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-ink/25 flex flex-col items-center justify-center gap-1">
        <Lock className="h-5 w-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-comic text-[10px] text-comic-yellow hover:underline drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
        >
          <Eye className="h-3 w-3" />
          Sign in
        </Link>
      </div>
    </div>
  );
}

export function IllustrationGalleryView({
  images,
  title,
  fullAccess,
  className,
}: IllustrationGalleryViewProps) {
  if (images.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <p className="font-comic text-sm text-ink">
        {images.length === 1 ? "1 illustration" : `${images.length} illustrations`}
      </p>
      <div
        className={cn(
          "grid gap-3",
          images.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
        )}
      >
        {images.map((src, index) => (
          <div key={`${src.slice(0, 48)}-${index}`} className="comic-panel p-1.5 overflow-hidden">
            <GalleryImage
              src={src}
              alt={`${title} — illustration ${index + 1}`}
              fullAccess={fullAccess}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
