"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";
import type { UserDiscussionParticipation } from "@/lib/discussions-store";
import type { UserForumParticipation } from "@/lib/forums-store";
import { getForumTags } from "@/lib/topic-tags";
import { getDiscussionTags } from "@/lib/discussion-tags";
import { Badge } from "@/components/ui/badge";

interface ProfileParticipationTabProps {
  username: string;
  isOwnProfile: boolean;
  forumItems: UserForumParticipation[];
  discussionItems: UserDiscussionParticipation[];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-comic text-lg text-ink border-b-2 border-dashed border-ink pb-2">
      {children}
    </h2>
  );
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function ProfileParticipationTab({
  username,
  isOwnProfile,
  forumItems,
  discussionItems,
}: ProfileParticipationTabProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionTitle>RPG topics</SectionTitle>
        <p className="text-xs text-ink-muted">
          {isOwnProfile
            ? "Stories you write in — jump back without searching."
            : `RPG topics @${username} participates in.`}
        </p>
        {forumItems.length === 0 ? (
          <p className="comic-panel p-4 text-sm text-ink-muted font-comic text-center">
            {isOwnProfile
              ? "No RPG topics yet — join or create one from RPG Topics."
              : "Not participating in any RPG topics yet."}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {forumItems.map(({ forum, post_count, last_post_at }) => {
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
                    <div className="min-w-0 flex-1">
                      <h3 className="font-comic text-base text-ink leading-tight line-clamp-2">
                        {forum.title}
                      </h3>
                      <p className="text-[11px] text-ink-muted flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3 shrink-0" />
                        {forum.members.join(", ")}
                      </p>
                      <p className="text-[11px] text-ink-muted mt-1">
                        {post_count === 0
                          ? "Member · no posts yet"
                          : `${post_count} post${post_count === 1 ? "" : "s"} · active ${formatWhen(last_post_at)}`}
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
        <SectionTitle>Forum discussions</SectionTitle>
        <p className="text-xs text-ink-muted">
          {isOwnProfile
            ? "Threads you started or replied to on the discussion board."
            : `Discussion threads @${username} has joined.`}
        </p>
        {discussionItems.length === 0 ? (
          <p className="comic-panel p-4 text-sm text-ink-muted font-comic text-center">
            {isOwnProfile
              ? "No discussions yet — browse Forum Discussions and join a thread."
              : "Not participating in any discussions yet."}
          </p>
        ) : (
          <div className="grid gap-2">
            {discussionItems.map(
              ({ thread, last_participated_at, is_author, user_reply_count }) => {
                const tags = getDiscussionTags(thread);
                return (
                  <Link
                    key={thread.id}
                    href={`/discussions/${thread.id}`}
                    className="comic-card p-4 block hover:no-underline"
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare
                        className="h-4 w-4 text-comic-red shrink-0 mt-0.5"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-comic text-base text-ink leading-tight line-clamp-2">
                          {thread.title}
                        </h3>
                        <p className="text-[11px] text-ink-muted mt-1">
                          {is_author
                            ? user_reply_count > 0
                              ? `Started · ${user_reply_count} repl${user_reply_count === 1 ? "y" : "ies"}`
                              : "Started this thread"
                            : `${user_reply_count} repl${user_reply_count === 1 ? "y" : "ies"}`}
                          {" · "}
                          active {formatWhen(last_participated_at)}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="tag" className="text-[10px]">
                            {thread.category}
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
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}
