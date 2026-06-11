"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useAuthorPosts } from "@/hooks/useAuthorPosts";
import { usePersonaProfile } from "@/hooks/usePersonaProfile";
import { getEditorProfile } from "@/lib/editor-profiles-store";
import { EditorBadge } from "@/components/editor/EditorBadge";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { ProfilePersonaTab } from "@/components/profile/ProfilePersonaTab";
import { ProfileCreationsTab } from "@/components/profile/ProfileCreationsTab";
import { ProfilePurchasesTab } from "@/components/profile/ProfilePurchasesTab";
import { ProfileFriendsTab } from "@/components/profile/ProfileFriendsTab";
import { ProfileFollowingTab } from "@/components/profile/ProfileFollowingTab";
import { usePurchasedPosts } from "@/hooks/usePurchasedPosts";
import { ProfileFollowerCount } from "@/components/profile/ProfileFollowerCount";
import { ProfileFollowButton } from "@/components/profile/ProfileFollowButton";
import { ProfileFriendButton } from "@/components/profile/ProfileFriendButton";
import { ProfileMessageButton } from "@/components/profile/ProfileMessageButton";
import { useAccountIdentity } from "@/hooks/useAccountIdentity";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { findUserByUsername } from "@/lib/discover-users";
import { resolveStaticProfile } from "@/lib/resolve-profile";
import { useVerifiedCreator } from "@/hooks/useVerifiedCreator";
import { useFriends } from "@/hooks/useFriends";
import { useFollowedTopics } from "@/hooks/useFollowedTopics";
import { useFollowedCreators } from "@/hooks/useFollowedCreators";
import { useProfilePrivacy } from "@/hooks/useProfilePrivacy";
import { usePersona } from "@/contexts/PersonaContext";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { Shield, User, FolderOpen, Users, BookOpen, ShoppingBag } from "lucide-react";

type ProfileTab = "persona" | "creations" | "purchases" | "friends" | "following";

export default function ProfilePage() {
  const params = useParams();
  const username = ((params.username as string) ?? "").toLowerCase();
  const identity = useActingIdentity();
  const { isPersonaSwitchInProgress } = usePersona();
  const account = useAccountIdentity();
  const isOwnProfile = identity?.username.toLowerCase() === username;
  const isOwnAccountProfile = account?.username.toLowerCase() === username;
  const [tab, setTab] = useState<ProfileTab>("persona");
  const [clientReady, setClientReady] = useState(false);

  const staticProfile = useMemo(() => resolveStaticProfile(username), [username]);
  const personaPage = usePersonaProfile(username);
  const creations = useAuthorPosts(username, isOwnProfile);
  const showPurchasesTab = isOwnProfile;
  const { entries: purchasedEntries, purchaseCount, loading: purchasesLoading } =
    usePurchasedPosts(
      showPurchasesTab && identity ? identity.username : null,
      showPurchasesTab && identity?.isActingAsPersona && account
        ? account.username
        : null
    );
  const [dynamicProfile, setDynamicProfile] = useState<Profile | null>(null);

  useEffect(() => {
    setClientReady(true);
  }, []);

  const creationAuthor = creations.find(
    (p) => p.author.username.toLowerCase() === username
  )?.author;
  const accountUsername = account?.username ?? null;
  const identityUsername = identity?.username ?? null;

  useEffect(() => {
    if (staticProfile) {
      setDynamicProfile((prev) => (prev === null ? prev : null));
      return;
    }

    let next: Profile | null = null;

    const discovered = findUserByUsername(username);
    if (discovered) {
      next = {
        id: `user-${discovered.username}`,
        username: discovered.username,
        display_name: discovered.display_name,
        bio: null,
        avatar_url: null,
        banner_url: null,
        persona_mode: true,
        is_verified_creator: false,
        created_at: new Date().toISOString(),
      };
    } else if (creationAuthor) {
      next = creationAuthor;
    } else if (isOwnAccountProfile && account?.profile) {
      next = account.profile;
    } else if (isOwnProfile && identity?.profile) {
      next = identity.profile;
    }

    setDynamicProfile((prev) => {
      if (!prev && !next) return prev;
      if (
        prev &&
        next &&
        prev.username === next.username &&
        prev.display_name === next.display_name &&
        prev.id === next.id
      ) {
        return prev;
      }
      return next;
    });
  }, [
    staticProfile,
    username,
    creationAuthor?.username,
    creationAuthor?.display_name,
    isOwnAccountProfile,
    isOwnProfile,
    accountUsername,
    identityUsername,
    account?.profile?.username,
    identity?.profile?.username,
  ]);

  const profile = staticProfile ?? dynamicProfile;

  const editorProfile = useMemo(() => getEditorProfile(username), [username]);
  const isVerified = useVerifiedCreator(username);
  const friends = useFriends(username);
  const followedTopics = useFollowedTopics(username);
  const followedCreators = useFollowedCreators(username);
  const { ready: privacyReady, showFriendsList } = useProfilePrivacy(username);
  const showFriendsTab =
    isOwnProfile || isOwnAccountProfile || (privacyReady && showFriendsList);

  useEffect(() => {
    if (tab === "friends" && !showFriendsTab) {
      setTab("persona");
    }
    if (tab === "purchases" && !showPurchasesTab) {
      setTab("persona");
    }
  }, [tab, showFriendsTab, showPurchasesTab]);

  if (!profile) {
    if (!clientReady) {
      return (
        <div className="comic-panel p-8 text-center font-comic text-ink-muted">
          Loading profile…
        </div>
      );
    }

    return (
      <div className="comic-panel p-8 text-center space-y-3">
        <h1 className="font-comic text-xl text-ink">Creator not found</h1>
        <p className="text-sm text-ink-muted">No profile for @{username}</p>
        <Link href="/explore" className="font-comic text-comic-red hover:underline text-sm">
          ← Explore creators
        </Link>
      </div>
    );
  }

  const tabs: { id: ProfileTab; label: string; icon: typeof User; count?: number }[] = [
    { id: "persona", label: "Persona", icon: User },
    { id: "creations", label: "Creations", icon: FolderOpen, count: creations.length },
    ...(showPurchasesTab
      ? [
          {
            id: "purchases" as const,
            label: "Purchased",
            icon: ShoppingBag,
            count: purchaseCount,
          },
        ]
      : []),
    ...(showFriendsTab
      ? [{ id: "friends" as const, label: "Friends", icon: Users, count: friends.length }]
      : []),
    {
      id: "following",
      label: "Following",
      icon: BookOpen,
      count: followedTopics.length + followedCreators.length,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="comic-card overflow-hidden">
        <div className="h-20 md:h-24 bg-comic-blue border-b-4 border-ink" />
        <div className="px-5 pb-4 -mt-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <UserAvatar
              username={profile.username}
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-comic text-2xl md:text-3xl text-ink">
                  {profile.display_name}
                </h1>
                {isVerified === true && (
                  <Shield className="h-5 w-5 text-comic-red" aria-label="Verified creator" />
                )}
                {editorProfile && <EditorBadge level={editorProfile.level} />}
              </div>
              <p className="text-sm text-ink-muted">@{profile.username}</p>
              {profile.bio && (
                <p className="text-sm text-ink-muted mt-1 max-w-xl">{profile.bio}</p>
              )}
            </div>
            {identity &&
              !isPersonaSwitchInProgress(profile.username) &&
              profile.username.toLowerCase() !== identity.username.toLowerCase() && (
                <div className="flex flex-col items-end gap-2">
                  <ProfileFollowButton
                    actorUsername={identity.username}
                    targetUsername={profile.username}
                    targetDisplayName={profile.display_name}
                  />
                  <ProfileFriendButton
                    actorUsername={identity.username}
                    actorDisplayName={identity.displayName}
                    targetUsername={profile.username}
                    targetDisplayName={profile.display_name}
                  />
                  <ProfileMessageButton
                    actorUsername={identity.username}
                    actorDisplayName={identity.displayName}
                    targetUsername={profile.username}
                    targetDisplayName={profile.display_name}
                  />
                </div>
              )}
          </div>
          <ProfileActions isOwnProfile={isOwnProfile} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="comic">RPG Persona</Badge>
            {creations.some((p) => p.pricing === "free") && (
              <Badge variant="free">Free works</Badge>
            )}
            {creations.some((p) => p.pricing !== "free") && (
              <Badge variant="paid">Premium</Badge>
            )}
            <ProfileFollowerCount username={profile.username} className="sm:ml-auto" />
          </div>
        </div>

        <nav className="flex border-t-4 border-ink bg-comic-yellow/50">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 font-comic text-sm border-r-2 border-ink last:border-r-0 transition-colors",
                tab === id
                  ? "bg-comic-red text-white"
                  : "text-ink hover:bg-comic-yellow"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {count !== undefined && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 border border-ink",
                    tab === id ? "bg-white/20" : "bg-surface"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </section>

      {tab === "persona" ? (
        <ProfilePersonaTab
          profile={profile}
          personaPage={personaPage}
          isOwnProfile={isOwnProfile}
        />
      ) : tab === "creations" ? (
        <ProfileCreationsTab
          creations={creations}
          showPendingNote={isOwnProfile}
          editable={isOwnProfile}
        />
      ) : tab === "purchases" ? (
        <ProfilePurchasesTab
          entries={purchasedEntries}
          purchaseCount={purchaseCount}
          loading={purchasesLoading}
        />
      ) : tab === "friends" ? (
        <ProfileFriendsTab
          username={username}
          isOwnAccountProfile={isOwnAccountProfile}
          isOwnProfile={isOwnProfile}
        />
      ) : (
        <ProfileFollowingTab username={username} isOwnProfile={isOwnProfile} />
      )}
    </div>
  );
}
