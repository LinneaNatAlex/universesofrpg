"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearTopicBookmark,
  getTopicBookmark,
  setTopicBookmark,
  subscribeTopicBookmarks,
} from "@/lib/topic-bookmarks-store";
import { paginateForumPosts } from "@/lib/topic-pagination";
import type { ForumChapter } from "@/types/database";
import { formatPartLabel } from "@/lib/forum-access";
import { findUserByUsername } from "@/lib/discover-users";
import { CommentAuthorRow } from "@/components/comments/CommentAuthorRow";
import { cn } from "@/lib/utils";

function ForumMetaLine({ meta }: { meta: ForumChapter["meta"] }) {
  const parts = [meta.when, meta.era, meta.season, meta.location].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <p className="forum-meta text-xs text-ink-muted italic mt-auto pt-4">
      {parts.join(" · ")}
    </p>
  );
}

interface TopicChapterReaderProps {
  forumId: string;
  chapterIndex: number;
  chapter: ForumChapter;
  username: string | null;
  jumpToLastOnNewPost?: boolean;
}

export function TopicChapterReader({
  forumId,
  chapterIndex,
  chapter,
  username,
  jumpToLastOnNewPost = false,
}: TopicChapterReaderProps) {
  const pages = useMemo(() => paginateForumPosts(chapter.posts), [chapter.posts]);
  const pageCount = pages.length;
  const [pageIndex, setPageIndex] = useState(0);
  const [bookmarkPage, setBookmarkPage] = useState<number | null>(null);
  const prevPostCount = useRef(chapter.posts.length);
  const initialized = useRef(false);

  useEffect(() => {
    initialized.current = false;
    setPageIndex(0);
    setBookmarkPage(null);
  }, [forumId, chapterIndex]);

  useEffect(() => {
    if (!username) return;

    const applyBookmark = () => {
      const saved = getTopicBookmark(username, forumId, chapterIndex);
      setBookmarkPage(saved?.page_index ?? null);
      if (!initialized.current && saved) {
        const maxPage = Math.max(0, paginateForumPosts(chapter.posts).length - 1);
        setPageIndex(Math.min(saved.page_index, maxPage));
        initialized.current = true;
      } else if (!initialized.current) {
        initialized.current = true;
      }
    };

    applyBookmark();
    return subscribeTopicBookmarks(applyBookmark);
  }, [username, forumId, chapterIndex, chapter.posts]);

  useEffect(() => {
    if (
      jumpToLastOnNewPost &&
      chapter.posts.length > prevPostCount.current
    ) {
      setPageIndex(Math.max(0, pages.length - 1));
    }
    prevPostCount.current = chapter.posts.length;
  }, [chapter.posts.length, jumpToLastOnNewPost, pages.length]);

  const safePage = Math.min(pageIndex, Math.max(0, pageCount - 1));
  const postsOnPage = pages[safePage] ?? [];
  const isBookmarkedHere = bookmarkPage === safePage;

  function goToPage(next: number) {
    const clamped = Math.max(0, Math.min(pageCount - 1, next));
    setPageIndex(clamped);
  }

  function handleBookmark() {
    if (!username) return;
    if (isBookmarkedHere) {
      clearTopicBookmark(username, forumId, chapterIndex);
      setBookmarkPage(null);
      return;
    }
    setTopicBookmark(username, forumId, chapterIndex, safePage);
    setBookmarkPage(safePage);
  }

  return (
    <div className="space-y-3">
      <div className="topic-a4-page comic-panel flex flex-col p-6 md:p-8">
        <header className="border-b-2 border-dashed border-ink pb-3 mb-4 shrink-0">
          <h2 className="font-comic text-xl text-ink">
            {formatPartLabel(chapter)}
          </h2>
          {pageCount > 1 && (
            <p className="text-xs text-ink-muted mt-1 font-comic">
              Page {safePage + 1} of {pageCount}
            </p>
          )}
        </header>

        <div className="topic-a4-page-body flex-1 min-h-0 space-y-4 prose-comic">
          {postsOnPage.length === 0 ? (
            <p className="text-sm text-ink-muted italic">No posts on this page yet.</p>
          ) : (
            postsOnPage.map((post) => {
              const author = findUserByUsername(post.author_username);
              const displayName = author?.display_name ?? post.author_username;
              return (
                <article key={post.id} className="border-l-4 border-comic-red pl-3 space-y-2">
                  <CommentAuthorRow
                    username={post.author_username}
                    displayName={displayName}
                    size="xs"
                    meta={`@${post.author_username}`}
                  />
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink pl-[2.75rem]">
                    {post.body}
                  </p>
                </article>
              );
            })
          )}
        </div>

        {safePage === pageCount - 1 && <ForumMetaLine meta={chapter.meta} />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={safePage <= 0}
            onClick={() => goToPage(safePage - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-0.5" />
            Previous
          </Button>
          <span className="font-comic text-xs text-ink-muted px-1">
            {safePage + 1} / {pageCount}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={safePage >= pageCount - 1}
            onClick={() => goToPage(safePage + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-0.5" />
          </Button>
        </div>

        {username && (
          <Button
            type="button"
            variant={isBookmarkedHere ? "comic" : "ghost"}
            size="sm"
            onClick={handleBookmark}
            className={cn(!isBookmarkedHere && "border-2 border-ink")}
          >
            {isBookmarkedHere ? (
              <>
                <BookmarkCheck className="h-4 w-4 mr-1" />
                Bookmarked (page {safePage + 1})
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4 mr-1" />
                Bookmark this page
              </>
            )}
          </Button>
        )}
      </div>

      {bookmarkPage !== null && bookmarkPage !== safePage && (
        <p className="text-xs text-ink-muted font-comic">
          You have a bookmark on page {bookmarkPage + 1}.{" "}
          <button
            type="button"
            className="text-comic-red hover:underline"
            onClick={() => goToPage(bookmarkPage)}
          >
            Jump to bookmark
          </button>
        </p>
      )}
    </div>
  );
}
