"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  COVER_IMAGE_ACCEPT,
  MAX_COVER_UPLOAD_BYTES,
  readCoverImageFile,
} from "@/lib/cover-image-upload";
import { isValidCoverSource } from "@/lib/post-cover";
import { cn } from "@/lib/utils";
import { ImageUp, Link2 } from "lucide-react";

type CoverInputMode = "upload" | "url";

interface CoverImageFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  hint: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

function detectMode(value: string): CoverInputMode {
  const trimmed = value.trim();
  if (trimmed.startsWith("data:image/")) return "upload";
  if (trimmed) return "url";
  return "upload";
}

export function CoverImageField({
  value,
  onChange,
  label,
  hint,
  placeholder = "https://…/your-cover.jpg",
  required = false,
  className,
}: CoverImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<CoverInputMode>(() => detectMode(value));
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState<string | null>(null);

  const valid = isValidCoverSource(value);
  const maxMb = Math.round(MAX_COVER_UPLOAD_BYTES / 1024 / 1024);

  async function handleFileChange(file: File | null) {
    if (!file) return;
    setUploadError(null);
    try {
      const dataUrl = await readCoverImageFile(file);
      setUploadName(file.name);
      onChange(dataUrl);
      setMode("upload");
    } catch (err) {
      setUploadName(null);
      onChange("");
      setUploadError(err instanceof Error ? err.message : "Could not read image.");
    }
  }

  function switchMode(next: CoverInputMode) {
    setMode(next);
    setUploadError(null);
    if (next !== detectMode(value)) {
      onChange("");
      setUploadName(null);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-comic text-ink">
        {label}
        {required && <span className="text-comic-red"> *</span>}
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => switchMode("upload")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-comic border-2 border-ink",
            mode === "upload"
              ? "bg-comic-red text-white shadow-[2px_2px_0_#1a1a2e]"
              : "bg-surface text-ink hover:bg-comic-yellow"
          )}
        >
          <ImageUp className="h-3.5 w-3.5" />
          Upload image
        </button>
        <button
          type="button"
          onClick={() => switchMode("url")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-comic border-2 border-ink",
            mode === "url"
              ? "bg-comic-red text-white shadow-[2px_2px_0_#1a1a2e]"
              : "bg-surface text-ink hover:bg-comic-yellow"
          )}
        >
          <Link2 className="h-3.5 w-3.5" />
          Image URL
        </button>
      </div>

      {mode === "upload" ? (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={COVER_IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              void handleFileChange(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-sm font-comic border-2 border-ink bg-surface hover:bg-comic-yellow"
            >
              Choose file…
            </button>
            {uploadName && (
              <span className="text-xs text-ink-muted truncate max-w-[14rem]">
                {uploadName}
              </span>
            )}
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setUploadName(null);
                  setUploadError(null);
                }}
                className="text-xs font-comic text-comic-red underline"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            JPG, PNG, WebP, or GIF — max {maxMb} MB. Stored in your browser until
            you connect cloud storage.
          </p>
          {uploadError && (
            <p className="text-xs text-comic-red font-comic">{uploadError}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            value={value.startsWith("data:") ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
            placeholder={placeholder}
          />
          <p className="text-xs text-ink-muted">
            Paste a direct link (Imgur, your site, etc.) if you already host the
            image online.
          </p>
        </div>
      )}

      <p className="text-xs text-ink-muted">{hint}</p>

      {value.trim() && (
        <div className="flex items-start gap-3">
          <div className="comic-cover relative w-14 h-[5.5rem] shrink-0 overflow-hidden bg-surface">
            {valid ? (
              <Image
                src={value.trim()}
                alt="Cover preview"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-comic-red font-comic px-1 text-center">
                Invalid image
              </div>
            )}
          </div>
          <p className="text-xs text-ink-muted pt-1">
            This is how your cover appears in Explore, the Shop, and on cards.
          </p>
        </div>
      )}
    </div>
  );
}
