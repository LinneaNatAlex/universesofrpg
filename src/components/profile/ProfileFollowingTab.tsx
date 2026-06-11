"use client";

import Image from "next/image";
import Link from "next/link";
import { useFollowedCreators } from "@/hooks/useFollowedCreators";
import { useFollowedTopics } from "@/hooks/useFollowedTopics";
import { getForumTags } from "@/lib/topic-tags";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Shield, Users } from "lucide-react";
import { useVerifiedCreator } from "@/hooks/useVerifiedCreator";

interface ProfileFollowingTabProps {
  username: string;
  isOwnProfile: boolean;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-comic text-lg text-ink border-b-2 border-dashed border-ink pb-2">
      {children}
    </h2>
  );
}

function CreatorRow({
  creatorUsername,
  displayName,
}: {
  creatorUsername: string;
  displayName: string;
}) {
  const verified = useVerifiedCreator(creatorUsername);

  return (
    <Link
      href={`/profile/${creatorUsername}`}
      className="comic-card p-4 flex items-center gap-3 hover:no-underline"
    >
      <UserAvatar username={creatorUsername} displayName={displayName} size="sm" />
      <div className="min-w-0">
        <p className="font-comic text-ink flex items-center gap-1.5">
          {displayName}
          {verified === true && (
            <Shield className="h-3.5 w-3.5 text-comic-red" aria-label="Verified" />
          )}
        </p>
        <p className="text-xs text-ink-muted">@{creatorUsername}</p>
      </div>
    </Link>
  );
}

export function ProfileFollowingTab({ username, isOwnProfile }: ProfileFollowingTabProps) {
  const topics = useFollowedTopics(username);
  const creators = useFollowedCreators(username);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionTitle>Topic follows</SectionTitle>
        <p className="text-xs text-ink-muted">
          {isOwnProfile
            ? "RPG stories you follow for chapter and reply alerts."
            : `RPG topics @${username} follows.`}
        </p>
        {topics.length === 0 ? (
          <p className="comic-panel p-4 text-sm text-ink-muted font-comic text-center">
            {isOwnProfile
              ? "No topics yet — open a topic and tap Follow topic."
              : "No topic follows yet."}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {topics.map((forum) => {
              const tags = getForumTags(forum);
              return (
                <Link
                  key={forum.id}
                  href={`/forum/${forum.id}`}
                  className="comic-card p-4 block hover:no-underline"
                >
                  <div className="flex gap-3">
                    {forum.book_cover_url && (
                      <div className="comic-cover shrink-0">
                        <Image
                          src={forum.book_cover_url}
                          alt=""
                          width={56}
                          height={78}
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-comic text-base text-ink leading-tight">
                        {forum.title}
                      </h3>
                      <p className="text-[11px] text-ink-muted flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3 shrink-0" />
                        {forum.members.join(", ")}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="tag" className="text-[10px]">
                          {forum.category}
                        </Badge>
                        {tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="tag" className="text-[10px]">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle>Following people</SectionTitle>
        <p className="text-xs text-ink-muted">
          {isOwnProfile
            ? "Creators you follow — separate from friends."
            : `Creators @${username} follows.`}
        </p>
        {creators.length === 0 ? (
          <p className="comic-panel p-4 text-sm text-ink-muted font-comic text-center">
            {isOwnProfile
              ? "No creators yet — visit a profile and tap Follow."
              : "Not following any creators yet."}
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {creators.map((c) => (
              <CreatorRow
                key={c.creator_username}
                creatorUsername={c.creator_username}
                displayName={c.creator_display_name}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
