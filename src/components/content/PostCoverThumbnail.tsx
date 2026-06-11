"use client";

import Image from "next/image";
import { LayoutPreview } from "@/components/content/LayoutPreview";
import { getPostCoverImage, postHasLiveCodeThumb } from "@/lib/post-cover";
import type { FeedPost } from "@/types/database";
import { cn } from "@/lib/utils";
import { BookOpen, ImageIcon } from "lucide-react";

const SIZE_CLASS = {
  sm: "w-14 h-[5.5rem]",
  feed: "w-[8.5rem] h-[12rem]",
  md: "w-[7.5rem] h-[10.5rem]",
  lg: "w-40 h-56",
} as const;

const IFRAME_HEIGHT = {
  sm: 88,
  feed: 192,
  md: 168,
  lg: 224,
} as const;

const IMAGE_SIZES: Record<keyof typeof SIZE_CLASS, string> = {
  sm: "56px",
  feed: "136px",
  md: "120px",
  lg: "160px",
};

interface PostCoverThumbnailProps {
  post: FeedPost;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  /** Shop / paid listings — image cover only, never live template preview. */
  coverOnly?: boolean;
}

export function PostCoverThumbnail({
  post,
  size = "sm",
  className,
  coverOnly = false,
}: PostCoverThumbnailProps) {
  const cover = getPostCoverImage(post);
  const liveCode = !coverOnly && postHasLiveCodeThumb(post);
  const dims = SIZE_CLASS[size];

  return (
    <div
      className={cn(
        "comic-cover shrink-0 relative overflow-hidden bg-surface",
        dims,
        className
      )}
    >
      {cover ? (
        <Image
          src={cover}
          alt=""
          fill
          sizes={IMAGE_SIZES[size]}
          className="object-cover"
          unoptimized
        />
      ) : liveCode ? (
        <div className="absolute inset-0 overflow-hidden">
          <LayoutPreview
            html={post.html_code!}
            css={post.css_code!}
            js={post.js_code}
            mode="compact"
            height={IFRAME_HEIGHT[size]}
            showHeader={false}
            className="!border-0 !shadow-none h-full [&>iframe]:!h-full"
          />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-ink-muted/50 p-1">
          {post.type === "digital_asset" ? (
            <ImageIcon className="h-5 w-5" />
          ) : (
            <BookOpen className="h-5 w-5" />
          )}
        </div>
      )}
    </div>
  );
}
