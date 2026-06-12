import type { ForumChapter, ForumPost, RpgForum } from "@/types/database";

function forumActivityTime(forum: RpgForum): number {
  let max = new Date(forum.created_at).getTime();
  for (const chapter of forum.chapters) {
    for (const post of chapter.posts) {
      const t = new Date(post.created_at).getTime();
      if (t > max) max = t;
    }
  }
  if (forum.locked_at) {
    const t = new Date(forum.locked_at).getTime();
    if (t > max) max = t;
  }
  return max;
}

function mergeForumPosts(a: ForumPost[], b: ForumPost[]): ForumPost[] {
  const map = new Map<string, ForumPost>();
  for (const post of a) map.set(post.id, post);
  for (const post of b) {
    const prev = map.get(post.id);
    if (!prev || new Date(post.created_at) >= new Date(prev.created_at)) {
      map.set(post.id, post);
    }
  }
  return [...map.values()].sort(
    (x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime()
  );
}

function mergeForumChapters(a: ForumChapter[], b: ForumChapter[]): ForumChapter[] {
  const map = new Map<number, ForumChapter>();

  for (const chapter of a) {
    map.set(chapter.number, { ...chapter, posts: [...chapter.posts] });
  }
  for (const chapter of b) {
    const prev = map.get(chapter.number);
    if (!prev) {
      map.set(chapter.number, { ...chapter, posts: [...chapter.posts] });
      continue;
    }
    map.set(chapter.number, {
      ...prev,
      title: chapter.title?.trim() ? chapter.title : prev.title,
      meta: { ...prev.meta, ...chapter.meta },
      posts: mergeForumPosts(prev.posts, chapter.posts),
    });
  }

  return [...map.values()].sort((x, y) => x.number - y.number);
}

/** Merge two copies of the same topic — keeps all replies from both sides. */
export function mergeRpgForum(local: RpgForum, remote: RpgForum): RpgForum {
  const localTime = forumActivityTime(local);
  const remoteTime = forumActivityTime(remote);
  const base = remoteTime > localTime ? remote : local;
  const other = remoteTime > localTime ? local : remote;

  return {
    ...base,
    members: [...new Set([...base.members, ...other.members])],
    chapters: mergeForumChapters(base.chapters, other.chapters),
  };
}

export function mergeRpgForumList(local: RpgForum[], remote: RpgForum[]): RpgForum[] {
  const map = new Map<string, RpgForum>();
  for (const forum of local) map.set(forum.id, forum);
  for (const forum of remote) {
    const prev = map.get(forum.id);
    map.set(forum.id, prev ? mergeRpgForum(prev, forum) : forum);
  }
  return [...map.values()];
}
