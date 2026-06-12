"use client";

import Link from "next/link";
import { LayoutPreview } from "@/components/content/LayoutPreview";
import { injectThemeMusic } from "@/lib/template-preview";
import type { PersonaProfilePage, Profile } from "@/types/database";
import { PenLine } from "lucide-react";

interface ProfilePersonaTabProps {
  profile: Profile;
  personaPage: PersonaProfilePage | undefined;
  isOwnProfile: boolean;
}

export function ProfilePersonaTab({
  profile,
  personaPage,
  isOwnProfile,
}: ProfilePersonaTabProps) {
  if (!personaPage) {
    return (
      <div className="comic-panel p-8 text-center space-y-4">
        <p className="font-comic text-ink">No persona page yet.</p>
        {profile.bio && (
          <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed italic">
            {profile.bio}
          </p>
        )}
        {isOwnProfile && (
          <Link
            href={`/profile/${profile.username}/edit`}
            className="inline-flex items-center gap-1.5 font-comic text-sm text-comic-red hover:underline"
          >
            <PenLine className="h-4 w-4" />
            Design your persona page →
          </Link>
        )}
      </div>
    );
  }

  if (personaPage.mode === "code" && personaPage.html_code && personaPage.css_code) {
    const html = injectThemeMusic(personaPage.html_code, personaPage.music_url);
    return (
      <div className="space-y-3">
        <LayoutPreview
          html={html}
          css={personaPage.css_code}
          js={personaPage.js_code}
          mode="full"
          defaultViewport="mobile"
        />
        {isOwnProfile && (
          <p className="text-xs text-ink-muted text-center">
            <Link
              href={`/profile/${profile.username}/edit`}
              className="text-comic-red font-comic hover:underline"
            >
              Edit persona page
            </Link>
          </p>
        )}
      </div>
    );
  }

  if (personaPage.mode === "text" && personaPage.text_content?.trim()) {
    return (
      <div className="space-y-3">
        <div className="comic-panel p-6 md:p-8 max-w-2xl mx-auto">
          <p className="whitespace-pre-wrap leading-relaxed text-ink text-sm md:text-base">
            {personaPage.text_content}
          </p>
        </div>
        {isOwnProfile && (
          <p className="text-xs text-ink-muted text-center">
            <Link
              href={`/profile/${profile.username}/edit`}
              className="text-comic-red font-comic hover:underline"
            >
              Edit persona page
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="comic-panel p-8 text-center">
      <p className="text-sm text-ink-muted">Persona page is empty.</p>
      {isOwnProfile && (
        <Link
          href={`/profile/${profile.username}/edit`}
          className="font-comic text-comic-red hover:underline text-sm mt-2 inline-block"
        >
          Add content →
        </Link>
      )}
    </div>
  );
}
