import type { FriendRequestsPlatformState } from "@/app/api/content/friend-requests/route";
import type { FriendsPlatformState } from "@/app/api/content/friends/route";
import type { ForumsPlatformState } from "@/app/api/content/forums/route";
import { normalizeFreeCodeListing } from "@/lib/moderation";
import {
  inferWritingCategoryFromTags,
  isWritingCategoryId,
  isWritingPostType,
} from "@/lib/writing-categories";
import type { FeedPost, FriendLink, FriendRequest, RpgForum } from "@/types/database";

/** Legacy demo persona usernames → current identities */
const LEGACY_PERSONAS: Record<string, { username: string; display_name: string }> = {
  lyra_weaver: { username: "chaz_copper", display_name: "Chaz Copper" },
  lyramoonwhisper: { username: "chaz_copper", display_name: "Chaz Copper" },
  hollowscribe: { username: "leon_jezz", display_name: "Leon Jezz" },
};

const DISPLAY_NAME_REPLACEMENTS: [string, string][] = [
  ["Lyra Moonwhisper", "Chaz Copper"],
  ["Hollow Scribe", "Leon Jezz"],
];

const USERNAME_REPLACEMENTS: [string, string][] = [
  ["lyra_weaver", "chaz_copper"],
  ["lyramoonwhisper", "chaz_copper"],
  ["hollowscribe", "leon_jezz"],
];

export function migrateUsername(username: string): string {
  const key = username.toLowerCase().trim();
  return LEGACY_PERSONAS[key]?.username ?? key;
}

export function migrateDisplayName(username: string, displayName: string): string {
  const legacy = LEGACY_PERSONAS[username.toLowerCase().trim()];
  if (legacy) return legacy.display_name;
  return migrateEmbeddedText(displayName) ?? displayName;
}

export function migrateEmbeddedText(text: string | null | undefined): string | null | undefined {
  if (text == null || text === "") return text;
  let result = text;
  for (const [old, next] of DISPLAY_NAME_REPLACEMENTS) {
    result = result.replaceAll(old, next);
  }
  for (const [old, next] of USERNAME_REPLACEMENTS) {
    result = result.replaceAll(old, next);
  }
  return result;
}

export function migrateFeedPost(post: FeedPost): FeedPost {
  const authorUsername = migrateUsername(post.author.username);
  const migrated: FeedPost = {
    ...post,
    author: {
      ...post.author,
      username: authorUsername,
      display_name: migrateDisplayName(post.author.username, post.author.display_name),
      bio: migrateEmbeddedText(post.author.bio) ?? post.author.bio,
    },
  };

  const writingCategory =
    migrated.writing_category && isWritingCategoryId(migrated.writing_category)
      ? migrated.writing_category
      : isWritingPostType(migrated.type)
        ? inferWritingCategoryFromTags(migrated.tags, migrated.type)
        : migrated.writing_category;

  return normalizeFreeCodeListing({
    ...migrated,
    writing_category: writingCategory,
    title: migrateEmbeddedText(migrated.title) ?? migrated.title,
    description: migrateEmbeddedText(migrated.description) ?? migrated.description,
    plot_synopsis: migrateEmbeddedText(migrated.plot_synopsis) ?? migrated.plot_synopsis,
    content: migrateEmbeddedText(migrated.content) ?? migrated.content,
    html_code: migrateEmbeddedText(migrated.html_code) ?? migrated.html_code,
    css_code: migrateEmbeddedText(migrated.css_code) ?? migrated.css_code,
    js_code: migrateEmbeddedText(migrated.js_code) ?? migrated.js_code,
    bbcode: migrateEmbeddedText(migrated.bbcode) ?? migrated.bbcode,
    preview_html_code:
      migrateEmbeddedText(migrated.preview_html_code) ?? migrated.preview_html_code,
    preview_css_code:
      migrateEmbeddedText(migrated.preview_css_code) ?? migrated.preview_css_code,
    preview_js_code:
      migrateEmbeddedText(migrated.preview_js_code) ?? migrated.preview_js_code,
  });
}

export function migrateRpgForum(forum: RpgForum): RpgForum {
  return {
    ...forum,
    title: migrateEmbeddedText(forum.title) ?? forum.title,
    plot_synopsis: migrateEmbeddedText(forum.plot_synopsis) ?? forum.plot_synopsis,
    creator_username: migrateUsername(forum.creator_username),
    members: [...new Set(forum.members.map((m) => migrateUsername(m)))],
    chapters: forum.chapters.map((chapter) => ({
      ...chapter,
      title: migrateEmbeddedText(chapter.title) ?? chapter.title,
      meta: {
        era: migrateEmbeddedText(chapter.meta.era) ?? chapter.meta.era,
        season: migrateEmbeddedText(chapter.meta.season) ?? chapter.meta.season,
        location: migrateEmbeddedText(chapter.meta.location) ?? chapter.meta.location,
        when: migrateEmbeddedText(chapter.meta.when) ?? chapter.meta.when,
      },
      posts: chapter.posts.map((p) => ({
        ...p,
        author_username: migrateUsername(p.author_username),
        body: migrateEmbeddedText(p.body) ?? p.body,
      })),
    })),
  };
}

export function migrateFriendRequest(request: FriendRequest): FriendRequest {
  return {
    ...request,
    from_username: migrateUsername(request.from_username),
    from_display_name: migrateDisplayName(
      request.from_username,
      request.from_display_name
    ),
    to_username: migrateUsername(request.to_username),
    to_display_name: migrateDisplayName(request.to_username, request.to_display_name),
  };
}

function mergeFriendLinks(a: FriendLink[], b: FriendLink[]): FriendLink[] {
  const map = new Map<string, FriendLink>();
  for (const link of [...a, ...b]) {
    map.set(link.username.toLowerCase(), link);
  }
  return [...map.values()];
}

export function migrateFriendsPlatformState(
  state: FriendsPlatformState
): FriendsPlatformState {
  const byOwner: Record<string, FriendLink[]> = {};

  for (const [owner, links] of Object.entries(state.byOwner ?? {})) {
    const newOwner = migrateUsername(owner);
    const migratedLinks = (links ?? []).map((link) => ({
      username: migrateUsername(link.username),
      display_name: migrateDisplayName(link.username, link.display_name),
      added_at: link.added_at,
    }));

    byOwner[newOwner] = byOwner[newOwner]
      ? mergeFriendLinks(byOwner[newOwner], migratedLinks)
      : migratedLinks;
  }

  return { byOwner };
}

export function migrateFriendRequestsPlatformState(
  state: FriendRequestsPlatformState
): FriendRequestsPlatformState {
  return {
    requests: (state.requests ?? []).map(migrateFriendRequest),
  };
}

export function migrateForumsPlatformState(state: ForumsPlatformState): ForumsPlatformState {
  return {
    custom: (state.custom ?? []).map(migrateRpgForum),
    deletedMockIds: state.deletedMockIds ?? [],
    deletedCustomIds: state.deletedCustomIds ?? [],
  };
}
