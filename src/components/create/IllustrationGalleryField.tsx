"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  COVER_IMAGE_ACCEPT,
  MAX_COVER_UPLOAD_BYTES,
  readCoverImageFile,
} from "@/lib/cover-image-upload";
import { MAX_ILLUSTRATIONS } from "@/lib/illustrations";
import { isValidCoverSource } from "@/lib/post-cover";
import { cn } from "@/lib/utils";
import { ImageUp, Link2, Star, Trash2, X } from "lucide-react";

interface IllustrationGalleryFieldProps {
  value: string[];
  onChange: (images: string[]) => void;
  className?: string;
}

export function IllustrationGalleryField({
  value,
  onChange,
  className,
}: IllustrationGalleryFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const maxMb = Math.round(MAX_COVER_UPLOAD_BYTES / 1024 / 1024);

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function setAsCover(index: number) {
    if (index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  }

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadError(null);

    const remaining = MAX_ILLUSTRATIONS - value.length;
    if (remaining <= 0) {
      setUploadError(`Maximum ${MAX_ILLUSTRATIONS} illustrations per post.`);
      return;
    }

    const next = [...value];
    for (const file of Array.from(files).slice(0, remaining)) {
      try {
        const dataUrl = await readCoverImageFile(file);
        next.push(dataUrl);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Could not read image.");
        break;
      }
    }
    onChange(next);
  }

  function addUrl() {
    setUploadError(null);
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!isValidCoverSource(trimmed)) {
      setUploadError("Paste a valid image URL (https://…) or upload a file.");
      return;
    }
    if (value.includes(trimmed)) {
      setUploadError("This image is already in the gallery.");
      return;
    }
    if (value.length >= MAX_ILLUSTRATIONS) {
      setUploadError(`Maximum ${MAX_ILLUSTRATIONS} illustrations per post.`);
      return;
    }
    onChange([...value, trimmed]);
    setUrlInput("");
    setShowUrlInput(false);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <label className="block text-sm font-comic text-ink">
          Illustrations<span className="text-comic-red"> *</span>
        </label>
        <p className="text-xs text-ink-muted mt-1">
          Upload one or more images — portraits, maps, item art, battle scenes, and more. The
          first image is the Explore / Shop thumbnail.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={value.length >= MAX_ILLUSTRATIONS}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-comic border-2 border-ink bg-surface hover:bg-comic-yellow disabled:opacity-40"
        >
          <ImageUp className="h-3.5 w-3.5" />
          Upload images
        </button>
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          disabled={value.length >= MAX_ILLUSTRATIONS}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-comic border-2 border-ink bg-surface hover:bg-comic-yellow disabled:opacity-40"
        >
          <Link2 className="h-3.5 w-3.5" />
          Add from URL
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={COVER_IMAGE_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {showUrlInput && (
        <div className="flex flex-wrap gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="https://…/your-art.png"
            className="flex-1 min-w-[12rem] border-2 border-ink bg-surface px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addUrl}
            className="px-3 py-2 text-sm font-comic border-2 border-ink bg-comic-yellow hover:bg-comic-red hover:text-white"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowUrlInput(false);
              setUrlInput("");
            }}
            className="px-2 py-2 border-2 border-ink bg-surface"
            aria-label="Close URL input"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <p className="text-[11px] text-ink-muted">
        JPG, PNG, WebP, or GIF — max {maxMb} MB each · {value.length}/{MAX_ILLUSTRATIONS}{" "}
        images
      </p>

      {uploadError && (
        <p className="text-xs font-comic text-comic-red">{uploadError}</p>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {value.map((src, index) => (
            <div
              key={`${src.slice(0, 48)}-${index}`}
              className="comic-panel p-1.5 space-y-1.5"
            >
              <div className="relative aspect-square overflow-hidden bg-surface border border-ink/20">
                <Image
                  src={src}
                  alt={`Illustration ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {index === 0 && (
                  <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-comic uppercase bg-comic-yellow text-ink border border-ink">
                    <Star className="h-2.5 w-2.5" />
                    Cover
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => setAsCover(index)}
                    className="flex-1 min-w-0 px-1.5 py-1 text-[10px] font-comic border border-ink bg-surface hover:bg-comic-yellow"
                  >
                    Set cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="inline-flex items-center justify-center px-1.5 py-1 text-[10px] font-comic border border-ink bg-surface hover:bg-comic-red hover:text-white"
                  aria-label={`Remove illustration ${index + 1}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
