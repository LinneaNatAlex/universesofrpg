"use client";

import { useRef, useState } from "react";
import { useAccountIdentity } from "@/hooks/useAccountIdentity";
import { useProfileAvatar } from "@/hooks/useProfileAvatar";
import { UserAvatar } from "@/components/profile/UserAvatar";
import {
  COVER_IMAGE_ACCEPT,
  readCoverImageFile,
} from "@/lib/cover-image-upload";
import { setProfileAvatarUrl } from "@/lib/profile-avatars-store";
import { Button } from "@/components/ui/button";
import { ImageUp, Trash2 } from "lucide-react";

export function ProfileAvatarSettings() {
  const account = useAccountIdentity();
  const avatarUrl = useProfileAvatar(account?.username ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!account) return null;

  async function handleFileChange(file: File | null) {
    if (!file || !account) return;
    setUploadError(null);
    setSaving(true);
    try {
      const dataUrl = await readCoverImageFile(file);
      const saved = setProfileAvatarUrl(account.username, dataUrl);
      if (!saved) {
        setUploadError(
          "Could not save photo in this browser. Try a smaller image or use a URL instead."
        );
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setSaving(false);
    }
  }

  function handleRemove() {
    if (!account) return;
    setUploadError(null);
    setProfileAvatarUrl(account.username, null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="border-t-4 border-dashed border-ink pt-6 space-y-3">
      <h3 className="font-comic text-lg text-ink">Profile picture</h3>
      <p className="text-xs text-ink-muted">
        Upload a photo from your device. It appears on your profile (@{account.username}),
        comments, feed cards, and friends lists.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar
          username={account.username}
          displayName={account.displayName}
          size="lg"
        />
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={COVER_IMAGE_ACCEPT}
            className="sr-only"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={saving}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageUp className="h-4 w-4 mr-1" />
            {avatarUrl ? "Change photo" : "Upload photo"}
          </Button>
          {avatarUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {uploadError && (
        <p className="text-xs font-comic text-comic-red">{uploadError}</p>
      )}
    </div>
  );
}
