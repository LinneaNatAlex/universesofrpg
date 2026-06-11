"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { usePersonaProfile } from "@/hooks/usePersonaProfile";
import { PersonaProfileEditor } from "@/components/profile/PersonaProfileEditor";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { getPersonaByUsername } from "@/lib/personas";

export default function EditPersonaProfilePage() {
  const params = useParams();
  const username = (params.username as string).toLowerCase();
  const { isLoggedIn, loading } = useAuth();
  const identity = useActingIdentity();
  const personaPage = usePersonaProfile(username);

  const isOwnProfile = identity?.username.toLowerCase() === username;
  const profile =
    getPersonaByUsername(username) ??
    (identity?.username.toLowerCase() === username
      ? {
          id: identity.authorId,
          username: identity.username,
          display_name: identity.displayName,
          bio: null,
          avatar_url: null,
          banner_url: null,
          persona_mode: true,
          is_verified_creator: false,
          created_at: new Date().toISOString(),
        }
      : null);

  if (loading) {
    return <div className="comic-panel p-8 text-center font-comic">Loading…</div>;
  }

  if (!isLoggedIn) {
    return <LoginCTA message="Sign in to edit your persona profile page." />;
  }

  if (!isOwnProfile) {
    return (
      <div className="comic-panel p-8 text-center space-y-3">
        <p className="font-comic text-ink">You can only edit your own persona page.</p>
        <Link href={`/profile/${username}`} className="text-sm text-comic-red hover:underline">
          ← Back to profile
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="comic-panel p-8 text-center">
        <p className="font-comic text-ink">Profile not found.</p>
      </div>
    );
  }

  return (
    <PersonaProfileEditor
      username={username}
      displayName={profile.display_name}
      initial={personaPage}
    />
  );
}
