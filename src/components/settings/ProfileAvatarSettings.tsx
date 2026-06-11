"use client";

import { useRef, useState } from "react";
import { useAccountIdentity } from "@/hooks/useAccountIdentity";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { PROFILE_AVATAR_UPDATED_EVENT, useProfileAvatar } from "@/hooks/useProfileAvatar";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { compressAvatarFile } from "@/lib/avatar-image";
import { COVER_IMAGE_ACCEPT } from "@/lib/cover-image-upload";
import { setProfileAvatarUrl } from "@/lib/profile-avatars-store";
import { Button } from "@/components/ui/button";
import { ImageUp, Trash2 } from "lucide-react";

export function ProfileAvatarSettings() {
  const account = useAccountIdentity();
  const acting = useActingIdentity();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const targetUsername =
    acting?.isActingAsPersona && acting.username
      ? acting.username
      : account?.username ?? null;
  const targetDisplayName =
    acting?.isActingAsPersona && acting.displayName
      ? acting.displayName
      : account?.displayName ?? "You";

  const avatarUrl = useProfileAvatar(targetUsername);

  if (!account || !targetUsername) return null;

  async function persistAvatar(dataUrl: string | null) {
    const savedLocal = setProfileAvatarUrl(targetUsername!, dataUrl);
    if (dataUrl && !savedLocal) {
      throw new Error(
        "Could not save photo in this browser. Try a smaller image."
      );
    }

    const res = await fetch("/api/profile/avatar", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        avatar_url: dataUrl,
        for_username: targetUsername,
      }),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        payload.error ??
          "Could not save photo on the server. Run migration 004_profile_avatar_media.sql in Supabase."
      );
    }

    window.dispatchEvent(new Event(PROFILE_AVATAR_UPDATED_EVENT));
  }

  async function handleFileChange(file: File | null) {
    if (!file) return;
    setUploadError(null);
    setSaving(true);
    try {
      const dataUrl = await compressAvatarFile(file);
      await persistAvatar(dataUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setUploadError(null);
    setSaving(true);
    try {
      await persistAvatar(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not remove photo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t-4 border-dashed border-ink pt-6 space-y-3">
      <h3 className="font-comic text-lg text-ink">Profile picture</h3>
      <p className="text-xs text-ink-muted">
        Uploading for <strong className="text-ink">@{targetUsername}</strong> ({targetDisplayName}
        ). Shown on profile, feed cards, comments, and the header menu.
        {acting?.isActingAsPersona && (
          <span className="block mt-1 text-comic-red font-comic">
            Demo persona mode — photo is stored for this creator account.
          </span>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar
          username={targetUsername}
          displayName={targetDisplayName}
          avatarUrl={avatarUrl}
          size="lg"
        />
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={COVER_IMAGE_ACCEPT}
            className="sr-only"
            onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => void handleRemove()}
            >
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
