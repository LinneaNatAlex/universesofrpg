"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { FeedCard } from "@/components/feed/FeedCard";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { getPersonaByUsername } from "@/lib/personas";
import { Shield } from "lucide-react";

export default function ProfilePage() {
  const params = useParams();
  const username = (params.username as string).toLowerCase();
  const allPosts = useFeedPosts();

  const profile = useMemo(() => {
    return (
      getPersonaByUsername(username) ??
      allPosts.find((p) => p.author.username.toLowerCase() === username)?.author ??
      null
    );
  }, [allPosts, username]);

  const creations = useMemo(
    () => allPosts.filter((p) => p.author.username.toLowerCase() === username),
    [allPosts, username]
  );

  if (!profile) {
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

  return (
    <div className="space-y-6">
      <section className="comic-card overflow-hidden">
        <div className="h-24 md:h-28 bg-comic-blue border-b-4 border-ink" />
        <div className="px-5 pb-5 -mt-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="comic-avatar !h-16 !w-16 !text-2xl shrink-0">
              {profile.display_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-comic text-2xl md:text-3xl text-ink">
                  {profile.display_name}
                </h1>
                {profile.is_verified_creator && (
                  <Shield className="h-5 w-5 text-comic-red" aria-label="Verified creator" />
                )}
              </div>
              <p className="text-sm text-ink-muted">@{profile.username}</p>
            </div>
          </div>
          {profile.bio && (
            <p className="mt-4 text-sm text-ink-muted max-w-lg leading-relaxed">{profile.bio}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="comic">RPG Persona</Badge>
            {creations.some((p) => p.pricing === "free") && (
              <Badge variant="free">Free works</Badge>
            )}
            {creations.some((p) => p.pricing !== "free") && (
              <Badge variant="paid">Premium</Badge>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-comic text-xl text-ink">Creations</h2>
          <span className="text-xs font-comic text-ink-muted">
            {creations.length} published
          </span>
        </div>
        {creations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {creations.map((post) => (
              <FeedCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="comic-panel p-6 text-center text-ink-muted font-comic">
            No published creations yet.
          </p>
        )}
      </section>
    </div>
  );
}
