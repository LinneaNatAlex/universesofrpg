"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useForums } from "@/hooks/useForums";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { useContentViewer } from "@/hooks/useContentViewer";
import {
  canAccessMatureCatalog,
  isVisibleInPublicCatalog,
} from "@/lib/content-rating";
import { ContentRatingBadge } from "@/components/content/ContentRatingBadge";
import { isForumVisibleInList } from "@/lib/forum-access";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  forumMatchesTopicCategory,
  forumMatchesTopicSearch,
  getForumTags,
  getTopicCategoriesForBrowse,
  isMatureTopicCategory,
  topicCategoryLabel,
} from "@/lib/topic-tags";
import { Plus, Search, Users } from "lucide-react";

export function ForumList() {
  const { isLoggedIn, loading } = useAuth();
  const { ctx: viewerCtx } = useContentViewer();
  const forums = useForums();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const canAccessMature = canAccessMatureCatalog(viewerCtx);
  const browseCategories = getTopicCategoriesForBrowse(canAccessMature);

  const browseTags = useMemo(() => {
    const tags = new Set<string>();
    for (const forum of forums) {
      if (!isVisibleInPublicCatalog(forum, viewerCtx)) continue;
      getForumTags(forum).forEach((t) => tags.add(t));
    }
    return [...tags].sort();
  }, [forums, viewerCtx]);

  const identity = useActingIdentity();

  useEffect(() => {
    if (activeCategory && isMatureTopicCategory(activeCategory) && !canAccessMature) {
      setActiveCategory(null);
    }
  }, [activeCategory, canAccessMature]);

  const filteredForums = useMemo(() => {
    return forums.filter((forum) => {
      if (!isForumVisibleInList(forum, identity?.username)) return false;
      if (!isVisibleInPublicCatalog(forum, viewerCtx)) return false;
      if (activeCategory && !forumMatchesTopicCategory(forum, activeCategory)) return false;
      if (activeTag && !getForumTags(forum).includes(activeTag)) return false;
      return forumMatchesTopicSearch(forum, query);
    });
  }, [forums, query, activeCategory, activeTag, identity?.username, viewerCtx]);

  if (!loading && !isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="font-comic text-3xl text-ink text-center">RPG (Topics)</h1>
        <p className="text-center text-sm text-ink-muted">
          Private play-by-post RPG writing with friends — chapters, settings, and replies.
        </p>
        <LoginCTA message="Log in to access your RPG topics." />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-comic text-2xl sm:text-3xl text-ink">RPG (Topics)</h1>
          <p className="text-sm text-ink-muted mt-1">
            Browse play-by-post RPG topics — follow any story for reply alerts.
          </p>
        </div>
        <Link href="/forum/new" className="shrink-0 self-start">
          <Button variant="comic" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1" />
            New topic
          </Button>
        </Link>
      </div>

      <div className="comic-panel flex items-center gap-2 px-4 py-2">
        <Search className="h-4 w-4 text-ink-muted shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics, writers, tags…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
        />
      </div>

      <section>
        <h2 className="font-comic text-sm uppercase text-ink-muted mb-2">Categories</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`font-comic text-xs px-3 py-1 border-2 border-ink ${
              !activeCategory ? "bg-comic-red text-white" : "bg-surface hover:bg-comic-yellow"
            }`}
          >
            All
          </button>
          {browseCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory((current) => (current === cat ? null : cat))}
              className={`font-comic text-xs px-3 py-1 border-2 border-ink ${
                activeCategory === cat
                  ? isMatureTopicCategory(cat)
                    ? "bg-comic-red text-white"
                    : "bg-comic-yellow"
                  : isMatureTopicCategory(cat)
                    ? "bg-surface hover:bg-comic-red/20 border-comic-red"
                    : "bg-surface hover:bg-comic-yellow/50"
              }`}
            >
              {topicCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </section>

      {browseTags.length > 0 && (
        <section>
          <h2 className="font-comic text-sm uppercase text-ink-muted mb-2">Tags</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={`font-comic text-xs px-3 py-1 border-2 border-ink ${
                !activeTag ? "bg-comic-red text-white" : "bg-surface hover:bg-comic-yellow"
              }`}
            >
              All
            </button>
            {browseTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag((current) => (current === tag ? null : tag))}
                className={`font-comic text-xs px-3 py-1 border-2 border-ink ${
                  activeTag === tag ? "bg-comic-yellow" : "bg-surface hover:bg-comic-yellow/50"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {forums.length === 0 ? (
        <div className="comic-panel p-8 text-center space-y-3">
          <p className="font-comic text-ink-muted">No RPG topics yet.</p>
          <Link href="/forum/new" className="font-comic text-comic-red hover:underline text-sm">
            Start your first RPG topic →
          </Link>
        </div>
      ) : filteredForums.length === 0 ? (
        <p className="comic-panel p-8 text-center font-comic text-ink-muted">
          No topics match your search.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredForums.map((forum) => {
            const tags = getForumTags(forum);
            return (
              <Link
                key={forum.id}
                href={`/forum/${forum.id}`}
                className="comic-card p-4 block hover:no-underline"
              >
                <div className="flex flex-col sm:flex-row gap-3 items-center sm:items-start">
                  {forum.book_cover_url && (
                    <div className="comic-cover shrink-0 mx-auto sm:mx-0">
                      <Image
                        src={forum.book_cover_url}
                        alt=""
                        width={64}
                        height={90}
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="min-w-0 w-full text-center sm:text-left">
                    <h3 className="font-comic text-xl text-ink">{forum.title}</h3>
                    {forum.plot_synopsis && (
                      <p className="text-xs text-ink-muted mt-1 line-clamp-2 italic">
                        {forum.plot_synopsis}
                      </p>
                    )}
                    <p className="text-xs text-ink-muted flex items-center gap-1 mt-1 justify-center sm:justify-start">
                      <Users className="h-3 w-3 shrink-0" />
                      {forum.members.join(", ")}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2 justify-center sm:justify-start">
                      {forum.is_private && (
                        <Badge variant="paid" className="text-[10px]">
                          Private
                        </Badge>
                      )}
                      {forum.is_locked && (
                        <Badge variant="comic" className="text-[10px]">
                          Finished
                        </Badge>
                      )}
                      {forum.shop_post_id && (
                        <Badge variant="paid" className="text-[10px]">
                          Shop
                        </Badge>
                      )}
                      <ContentRatingBadge item={forum} />
                      <Badge variant="tag" className="text-[10px]">
                        {topicCategoryLabel(forum.category)}
                      </Badge>
                      {tags
                        .filter((t) => t !== forum.category)
                        .slice(0, 3)
                        .map((tag) => (
                          <Badge key={tag} variant="tag" className="text-[10px]">
                            #{tag}
                          </Badge>
                        ))}
                      <Badge variant="tag" className="text-[10px]">
                        {forum.chapters.length} part{forum.chapters.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
