"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useForum, useForums } from "@/hooks/useForums";
import { CoverImageField } from "@/components/create/CoverImageField";
import { FriendInvitePicker } from "@/components/friends/FriendInvitePicker";
import { TopicChapterReader } from "@/components/forum/TopicChapterReader";
import { TopicFollowButton } from "@/components/forum/TopicFollowButton";
import { TopicTagPicker } from "@/components/forum/TopicTagPicker";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { useFriends } from "@/hooks/useFriends";
import { isFriend } from "@/lib/friends-store";
import {
  forumLiveSyncErrorMessage,
  liveSyncSetupHint,
  syncForumLive,
} from "@/lib/live-content-sync";
import {
  addForumChapter,
  addForumReply,
  createForum,
  getNextChapterNumber,
  isForumMember,
} from "@/lib/forums-store";
import {
  formatPartLabel,
  getForumAccessLevel,
  isForumCreator,
  isForumVisibleInList,
} from "@/lib/forum-access";
import { TopicCreatorPanel } from "@/components/forum/TopicCreatorPanel";
import { TopicShopGate } from "@/components/forum/TopicShopGate";
import { subscribePurchases } from "@/lib/purchases-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  forumMatchesTopicSearch,
  getForumTags,
  TOPIC_CATEGORIES,
} from "@/lib/topic-tags";
import type { RpgForumMeta } from "@/types/database";
import { Plus, Search, Users } from "lucide-react";

function ForumMetaLine({ meta }: { meta: RpgForumMeta }) {
  const parts = [meta.when, meta.era, meta.season, meta.location].filter(Boolean);
  if (parts.length === 0) return null;

  return <p className="forum-meta text-xs text-ink-muted italic mt-2">{parts.join(" · ")}</p>;
}

export function ForumList() {
  const { isLoggedIn, loading } = useAuth();
  const forums = useForums();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const browseTags = useMemo(() => {
    const tags = new Set<string>();
    for (const forum of forums) {
      getForumTags(forum).forEach((t) => tags.add(t));
    }
    return [...tags].sort();
  }, [forums]);

  const identity = useActingIdentity();

  const filteredForums = useMemo(() => {
    return forums.filter((forum) => {
      if (!isForumVisibleInList(forum, identity?.username)) return false;
      if (activeCategory && forum.category !== activeCategory) return false;
      if (activeTag && !getForumTags(forum).includes(activeTag)) return false;
      return forumMatchesTopicSearch(forum, query);
    });
  }, [forums, query, activeCategory, activeTag, identity?.username]);

  if (loading) return <div className="comic-panel p-8 text-center font-comic">Loading…</div>;

  if (!isLoggedIn) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-comic text-3xl text-ink">RPG (Topics)</h1>
          <p className="text-sm text-ink-muted">
            Browse play-by-post RPG topics — follow any story for reply alerts.
          </p>
        </div>
        <Link href="/forum/new">
          <Button variant="comic">
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
          {TOPIC_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() =>
                setActiveCategory((current) => (current === cat ? null : cat))
              }
              className={`font-comic text-xs px-3 py-1 border-2 border-ink ${
                activeCategory === cat ? "bg-comic-yellow" : "bg-surface hover:bg-comic-yellow/50"
              }`}
            >
              {cat}
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
                    <p className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3 shrink-0" />
                      {forum.members.join(", ")}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
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
                      <Badge variant="tag" className="text-[10px]">
                        {forum.category}
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

type TopicCreateMode = "new" | "continue";

export function NewForumForm() {
  const { isLoggedIn, loading } = useAuth();
  const identity = useActingIdentity();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyParam = searchParams.get("story");
  const allForums = useForums();

  const [mode, setMode] = useState<TopicCreateMode>(storyParam ? "continue" : "new");
  const [existingForumId, setExistingForumId] = useState(storyParam ?? "");
  const [title, setTitle] = useState("");
  const [plotSynopsis, setPlotSynopsis] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [category, setCategory] = useState("fantasy");
  const [topicTags, setTopicTags] = useState<string[]>(["rpg", "play-by-post"]);
  const friends = useFriends(identity?.username ?? null);
  const [startNewPart, setStartNewPart] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("Part 1");
  const [meta, setMeta] = useState<RpgForumMeta>({
    era: "",
    season: "",
    location: "",
    when: "",
  });
  const [firstPost, setFirstPost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const writerForums = useMemo(() => {
    if (!identity?.username) return [];
    return allForums.filter((forum) => isForumMember(forum, identity.username));
  }, [allForums, identity?.username]);

  const selectedForum = writerForums.find((forum) => forum.id === existingForumId);
  const nextChapterNumber = selectedForum ? getNextChapterNumber(selectedForum) : 2;

  useEffect(() => {
    if (storyParam && writerForums.some((f) => f.id === storyParam)) {
      setMode("continue");
      setExistingForumId(storyParam);
    }
  }, [storyParam, writerForums]);

  useEffect(() => {
    if (mode === "continue" && selectedForum) {
      setChapterTitle(startNewPart ? `Part ${nextChapterNumber}` : "");
    } else if (mode === "new") {
      setChapterTitle("Part 1");
      setStartNewPart(true);
    }
  }, [mode, selectedForum, nextChapterNumber, startNewPart]);

  if (loading) return null;
  if (!isLoggedIn) {
    return <LoginCTA message="You must be logged in to start an RPG topic." />;
  }

  async function finishForumSync(navigate: () => void) {
    const ok = await syncForumLive();
    setSubmitting(false);
    const message = forumLiveSyncErrorMessage(ok);
    if (message) {
      setError(`${message} ${liveSyncSetupHint()}`);
      return;
    }
    navigate();
  }

  async function handleCreate() {
    setError(null);

    if (!identity?.username) {
      setError("Could not resolve your profile. Try signing in again.");
      return;
    }
    if (!firstPost.trim()) {
      setError("Write your post before publishing.");
      return;
    }

    setSubmitting(true);

    if (mode === "continue") {
      if (!existingForumId || !selectedForum) {
        setSubmitting(false);
        setError("Choose which story you want to continue.");
        return;
      }
      if (selectedForum.is_locked) {
        setSubmitting(false);
        setError("This story is locked. The creator must unlock it before you can continue.");
        return;
      }

      const wantsNewPart = startNewPart || chapterTitle.trim().length > 0;

      if (wantsNewPart) {
        const chapter = addForumChapter({
          forum_id: existingForumId,
          author_username: identity.username,
          chapter_title: chapterTitle.trim() || `Part ${nextChapterNumber}`,
          chapter_meta: meta,
          opening_post: firstPost.trim(),
        });

        if (!chapter) {
          setSubmitting(false);
          setError("Could not add part — only invited writers can continue a story.");
          return;
        }

        await finishForumSync(() => {
          router.push(`/forum/${existingForumId}?chapter=${chapter.number}`);
          router.refresh();
        });
        return;
      }

      const lastChapterIndex = selectedForum.chapters.length - 1;
      const reply = addForumReply(
        existingForumId,
        lastChapterIndex,
        identity.username,
        firstPost.trim()
      );

      if (!reply) {
        setSubmitting(false);
        setError("Could not post — only invited writers can continue a story.");
        return;
      }

      const lastPart = selectedForum.chapters[lastChapterIndex];
      await finishForumSync(() => {
        router.push(
          `/forum/${existingForumId}?chapter=${lastPart?.number ?? 1}`
        );
        router.refresh();
      });
      return;
    }

    if (!title.trim()) {
      setSubmitting(false);
      setError("Give your RPG topic a title.");
      return;
    }
    const validInvites = selectedFriends.filter((username) =>
      isFriend(identity.username, username)
    );
    if (validInvites.length === 0) {
      setSubmitting(false);
      setError("Invite at least one friend from your friends list.");
      return;
    }

    let forum;
    try {
      forum = createForum({
        title: title.trim(),
        plot_synopsis: plotSynopsis.trim() || null,
        book_cover_url: coverUrl.trim() || null,
        creator_username: identity.username,
        category,
        tags: topicTags,
        member_usernames: validInvites,
        is_private: isPrivate,
        chapter_title: chapterTitle.trim() || "Part 1",
        chapter_meta: meta,
        opening_post: firstPost.trim(),
      });
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof Error ? err.message : "Could not save your RPG topic."
      );
      return;
    }

    await finishForumSync(() => {
      router.push(`/forum/${forum.id}?chapter=1`);
      router.refresh();
    });
  }

  const partLabel =
    mode === "continue"
      ? startNewPart
        ? `Part ${nextChapterNumber}`
        : "Continue in current part"
      : "Part 1";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-comic text-3xl text-ink">RPG topic studio</h1>
      <p className="text-sm text-ink-muted">
        Start a new story or continue writing. Use a new <strong>Part</strong> only when the
        story moves to a new arc — otherwise keep posting in the current part.
      </p>
      {identity?.isActingAsPersona && (
        <p className="text-xs font-comic text-comic-red">
          Creating as @{identity.username}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`font-comic text-sm px-4 py-2 border-2 border-ink ${
            mode === "new"
              ? "bg-comic-red text-white shadow-[2px_2px_0_#1a1a2e]"
              : "bg-surface hover:bg-comic-yellow"
          }`}
        >
          New story
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("continue");
            setStartNewPart(false);
          }}
          className={`font-comic text-sm px-4 py-2 border-2 border-ink ${
            mode === "continue"
              ? "bg-comic-red text-white shadow-[2px_2px_0_#1a1a2e]"
              : "bg-surface hover:bg-comic-yellow"
          }`}
        >
          Continue story
        </button>
      </div>

      <div className="comic-panel p-5 space-y-4">
        {mode === "continue" ? (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-comic text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={startNewPart}
                onChange={(e) => setStartNewPart(e.target.checked)}
              />
              Start a new part (leave unchecked to continue in the current part)
            </label>
          </div>
        ) : null}

        {mode === "continue" ? (
          <div>
            <label className="font-comic text-sm block mb-1">Story</label>
            {writerForums.length === 0 ? (
              <p className="text-sm text-ink-muted comic-panel px-3 py-2">
                You are not a writer in any topics yet. Start a new story first, or get
                invited to one.
              </p>
            ) : (
              <select
                value={existingForumId}
                onChange={(e) => setExistingForumId(e.target.value)}
                className="w-full border-2 border-ink px-3 py-2 text-sm bg-surface"
              >
                <option value="">Choose a story…</option>
                {writerForums.map((forum) => (
                  <option key={forum.id} value={forum.id}>
                    {forum.title} ({forum.chapters.length} part
                    {forum.chapters.length === 1 ? "" : "s"})
                  </option>
                ))}
              </select>
            )}
            {selectedForum && (
              <p className="text-xs text-ink-muted mt-2">
                Writers: {selectedForum.members.join(", ")} · Followers get notified when
                part {nextChapterNumber} is published.
              </p>
            )}
          </div>
        ) : (
          <>
            <div>
              <label className="font-comic text-sm block mb-1">Story / book title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-2 border-ink px-3 py-2 text-sm bg-surface"
                placeholder="The Hollow Gate"
              />
            </div>
            <div>
              <label className="font-comic text-sm block mb-1">
                Teaser synopsis <span className="text-ink-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={plotSynopsis}
                onChange={(e) => setPlotSynopsis(e.target.value)}
                rows={2}
                maxLength={280}
                placeholder="Where does the story take place? Hook readers in 1–2 sentences…"
                className="w-full border-2 border-ink px-3 py-2 text-sm bg-surface"
              />
              <p className="text-[10px] text-ink-muted mt-1">{plotSynopsis.length}/280</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-comic text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              Private topic (only invited writers can find and read it)
            </label>
            <CoverImageField
              value={coverUrl}
              onChange={setCoverUrl}
              label="Book cover"
              hint="Optional — required later if you sell the story on the Shop."
            />
            <TopicTagPicker
              category={category}
              tags={topicTags}
              onCategoryChange={setCategory}
              onTagsChange={setTopicTags}
            />
            <FriendInvitePicker
              friends={friends}
              selected={selectedFriends}
              onChange={setSelectedFriends}
            />
          </>
        )}

        {(mode === "new" || (mode === "continue" && startNewPart)) && (
          <div className="border-t-2 border-dashed border-ink pt-4">
            <label className="font-comic text-sm block mb-2">{partLabel}</label>
            <input
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              className="w-full border-2 border-ink px-3 py-2 text-sm bg-surface mb-3"
              placeholder={partLabel}
            />
            <div className="grid grid-cols-2 gap-2">
              {(["when", "era", "season", "location"] as const).map((key) => (
                <input
                  key={key}
                  value={meta[key]}
                  onChange={(e) => setMeta({ ...meta, [key]: e.target.value })}
                  placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                  className="border-2 border-ink px-2 py-1.5 text-xs bg-surface"
                />
              ))}
            </div>
            <ForumMetaLine meta={meta} />
          </div>
        )}

        <div>
          <label className="font-comic text-sm block mb-1">
            {mode === "continue" && !startNewPart ? "Your post" : "Opening post"}
          </label>
          <textarea
            value={firstPost}
            onChange={(e) => setFirstPost(e.target.value)}
            rows={5}
            className="w-full border-2 border-ink px-3 py-2 text-sm bg-surface"
            placeholder={
              mode === "continue" && !startNewPart
                ? "Continue the scene in the current part…"
                : "Set the scene for this part…"
            }
          />
        </div>

        {error && (
          <p className="text-sm text-comic-red bg-comic-red/10 border border-comic-red px-3 py-2">
            {error}
          </p>
        )}

        <Button
          variant="comic"
          onClick={() => void handleCreate()}
          disabled={
            submitting || (mode === "continue" && (writerForums.length === 0 || !existingForumId))
          }
        >
          {submitting
            ? "Saving…"
            : mode === "continue"
              ? startNewPart
                ? `Publish part ${nextChapterNumber}`
                : "Post in current part"
              : "Create story & part 1"}
        </Button>
      </div>
    </div>
  );
}

export function ForumDetail({ forumId }: { forumId: string }) {
  const { isLoggedIn, loading } = useAuth();
  const identity = useActingIdentity();
  const searchParams = useSearchParams();
  const forum = useForum(forumId);
  const [activeChapter, setActiveChapter] = useState(0);
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [purchaseTick, setPurchaseTick] = useState(0);

  useEffect(() => {
    return subscribePurchases(() => setPurchaseTick((n) => n + 1));
  }, []);

  useEffect(() => {
    if (!forum) return;
    const chapterParam = searchParams.get("chapter");
    if (!chapterParam) return;
    const chapterNumber = Number.parseInt(chapterParam, 10);
    if (Number.isNaN(chapterNumber)) return;
    const index = forum.chapters.findIndex((ch) => ch.number === chapterNumber);
    if (index >= 0) setActiveChapter(index);
  }, [forum, searchParams]);

  if (loading) return null;
  if (!isLoggedIn) return <LoginCTA message="Log in to read RPG topics." />;
  if (!forum) {
    return (
      <div className="comic-panel p-8 text-center space-y-3">
        <p className="font-comic text-ink">RPG topic not found.</p>
        <Link href="/forum" className="text-sm text-comic-red hover:underline">
          ← Back to RPG topics
        </Link>
      </div>
    );
  }

  const access = getForumAccessLevel(forum, identity?.username);
  const isCreator =
    !!identity?.username && isForumCreator(forum, identity.username);
  const canWrite =
    !!identity?.username &&
    isForumMember(forum, identity.username) &&
    !forum.is_locked &&
    access === "full";

  if (access === "none") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href="/forum" className="text-sm font-comic text-comic-red hover:underline">
          ← Back to RPG topics
        </Link>
        <div className="comic-panel p-8 text-center space-y-2">
          <h1 className="font-comic text-xl text-ink">Private topic</h1>
          <p className="text-sm text-ink-muted">
            Only invited writers can read this RPG. Ask the creator for an invite.
          </p>
        </div>
      </div>
    );
  }

  if (access === "teaser" && identity?.username) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href="/forum" className="text-sm font-comic text-comic-red hover:underline">
          ← Back to RPG topics
        </Link>
        <TopicShopGate
          forum={forum}
          username={identity.username}
          onPurchased={() => setPurchaseTick((n) => n + 1)}
        />
      </div>
    );
  }

  const chapter = forum.chapters[activeChapter];
  if (!chapter) {
    return <p className="font-comic text-center">This topic has no parts yet.</p>;
  }

  function handleReply() {
    setReplyError(null);
    if (!reply.trim()) {
      setReplyError("Write something before posting.");
      return;
    }
    if (!identity?.username) {
      setReplyError("Could not resolve your profile.");
      return;
    }
    if (!forum || !isForumMember(forum, identity.username)) {
      setReplyError("Only invited members can reply in this topic.");
      return;
    }

    const result = addForumReply(forumId, activeChapter, identity.username, reply);
    if (!result) {
      setReplyError("Could not post reply. Only invited members can write here.");
      return;
    }
    setReply("");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/forum" className="text-sm font-comic text-comic-red hover:underline">
        ← Back to RPG topics
      </Link>

      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
        {forum.book_cover_url && (
          <div className="comic-cover shrink-0 mx-auto sm:mx-0 relative w-[6.25rem] h-[8.75rem] overflow-hidden bg-surface">
            <Image
              src={forum.book_cover_url}
              alt=""
              fill
              sizes="100px"
              className="object-cover object-center"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0 w-full text-center sm:text-left">
          <h1 className="font-comic text-2xl sm:text-3xl text-ink">{forum.title}</h1>
          {forum.plot_synopsis && (
            <p className="text-sm text-ink-muted italic mt-2 leading-relaxed">
              {forum.plot_synopsis}
            </p>
          )}
          <p className="text-xs text-ink-muted mt-1">Writers: {forum.members.join(", ")}</p>
          <div className="flex flex-wrap gap-1 mt-2">
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
            <Badge variant="tag" className="text-[10px]">
              {forum.category}
            </Badge>
            {getForumTags(forum)
              .filter((t) => t !== forum.category)
              .map((tag) => (
                <Badge key={tag} variant="tag" className="text-[10px]">
                  #{tag}
                </Badge>
              ))}
          </div>
          {!canWrite && (
            <Badge variant="tag" className="mt-2 text-[10px]">
              Read-only — invited writers only
            </Badge>
          )}
          {identity?.isActingAsPersona && (
            <p className="text-xs font-comic text-comic-red mt-1">
              Posting as @{identity.username}
            </p>
          )}
          <div className="mt-3">
            <TopicFollowButton forumId={forum.id} />
          </div>
        </div>
      </div>

      {isCreator && identity && (
        <TopicCreatorPanel forum={forum} creatorUsername={identity.username} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {forum.chapters.map((ch, i) => (
          <button
            key={ch.number}
            type="button"
            onClick={() => setActiveChapter(i)}
            className={`font-comic text-xs px-3 py-1 border-2 border-ink ${
              activeChapter === i ? "bg-comic-yellow" : "bg-surface"
            }`}
          >
            {formatPartLabel(ch)}
          </button>
        ))}
        {canWrite && (
          <Link href={`/forum/new?story=${forum.id}`}>
            <Button variant="secondary" size="sm" className="text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Continue / new part
            </Button>
          </Link>
        )}
      </div>

      <TopicChapterReader
        key={`${forumId}-${activeChapter}`}
        forumId={forumId}
        chapterIndex={activeChapter}
        chapter={chapter}
        username={identity?.username ?? null}
        jumpToLastOnNewPost={canWrite}
      />

      {canWrite ? (
        <div className="space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder="Write your reply…"
            className="w-full border-2 border-ink px-3 py-2 text-sm bg-surface"
          />
          {replyError && <p className="text-xs text-comic-red">{replyError}</p>}
          <Button variant="comic" onClick={handleReply}>
            Post reply
          </Button>
        </div>
      ) : forum.is_locked ? (
        <p className="text-sm text-ink-muted comic-panel px-4 py-3">
          This story is finished and locked — no new replies.
          {forum.shop_post_id && " Purchase the Shop listing to read the full arc."}
        </p>
      ) : (
        <p className="text-sm text-ink-muted comic-panel px-4 py-3">
          You can read this topic, but only invited members can post replies.
        </p>
      )}
    </div>
  );
}
