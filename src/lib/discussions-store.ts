import type { DiscussionsPlatformState } from "@/app/api/content/discussions/route";
import { readJson, writeJson } from "@/lib/browser-storage";
import {
  pushDiscussionsPlatformState,
  scheduleDiscussionsPlatformPush,
} from "@/lib/content-sync";
import {
  discussionPopularityScore,
  normalizeDiscussionCategory,
  normalizeDiscussionTagList,
} from "@/lib/discussion-tags";
import type { DiscussionReply, DiscussionThread } from "@/types/database";

const STORAGE_KEY = "uorpg-discussions-state";

const MOCK_THREAD_IDS = new Set(["d1", "d2", "d3", "d4", "d5"]);

const SEED_THREADS: DiscussionThread[] = [
  {
    id: "d1",
    title: "Best way to pitch a new RPG group to friends?",
    body: "I want to start a play-by-post group but my friends are shy about writing. Any icebreakers or session-zero tips that worked for you?",
    author_username: "chaz_copper",
    author_display_name: "Chaz Copper",
    category: "rpg-tips",
    tags: ["beginner", "session-zero", "player-advice"],
    reply_count: 3,
    views: 248,
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    last_activity_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "d2",
    title: "Shop templates — what do you look for before buying?",
    body: "Curious what makes you click Buy on a profile theme. Animation? Mobile layout? Niche genre styling?",
    author_username: "roninforge",
    author_display_name: "Ronin Forge",
    category: "shop",
    tags: ["templates", "creators"],
    reply_count: 1,
    views: 190,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    last_activity_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: "d3",
    title: "Homebrew sanity system for cosmic horror",
    body: "Sharing a lightweight dread track I'm testing. Would love feedback before I publish it as a free post.",
    author_username: "leon_jezz",
    author_display_name: "Leon Jezz",
    category: "horror",
    tags: ["homebrew", "rules", "horror"],
    reply_count: 2,
    views: 412,
    created_at: new Date(Date.now() - 86400000 * 21).toISOString(),
    last_activity_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "d4",
    title: "Site feedback: notification bell is great, what next?",
    body: "Loving the comic UI direction. What moderation or discovery features would you prioritize?",
    author_username: "miraquill",
    author_display_name: "Mira Quill",
    category: "feedback",
    tags: ["tools"],
    reply_count: 0,
    views: 96,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    last_activity_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "d5",
    title: "How do you organize multiple RPG topics at once?",
    body: "I follow three campaigns and write in two. Looking for workflows — bookmarks, notes, anything.",
    author_username: "embercartograph",
    author_display_name: "Ember Cartograph",
    category: "general",
    tags: ["rpg-tips", "tools"],
    reply_count: 0,
    views: 74,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    last_activity_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const SEED_REPLIES: DiscussionReply[] = [
  {
    id: "dr1",
    thread_id: "d3",
    author_username: "roninforge",
    author_display_name: "Ronin Forge",
    body: "Love the slow-burn reveal in your dread track. Maybe add a 'last safe haven' counter players can see?",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "dr2",
    thread_id: "d3",
    author_username: "chaz_copper",
    author_display_name: "Chaz Copper",
    body: "I'd playtest this in a one-shot first — cosmic horror can stall if the clock is too opaque.",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "dr3",
    thread_id: "d1",
    author_username: "leon_jezz",
    author_display_name: "Leon Jezz",
    body: "Short prompt chains work wonders. Give everyone a 2-sentence character hook before chapter one.",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "dr4",
    thread_id: "d1",
    author_username: "embercartograph",
    author_display_name: "Ember Cartograph",
    body: "We did a 'postcard from your character' round — low pressure and everyone laughed.",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "dr5",
    thread_id: "d1",
    author_username: "miraquill",
    author_display_name: "Mira Quill",
    body: "Session zero as a forum thread works too. Let them reply in character to one shared prompt.",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "dr6",
    thread_id: "d2",
    author_username: "chaz_copper",
    author_display_name: "Chaz Copper",
    body: "Mobile layout is non-negotiable for me. If the live preview breaks on phone, I bounce.",
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
];

const SEED_REPLY_IDS = new Set(SEED_REPLIES.map((r) => r.id));

export type DiscussionsState = DiscussionsPlatformState;

let threads: DiscussionThread[] = [];
let replies: DiscussionReply[] = [];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function loadState(): DiscussionsState {
  const parsed = readJson<DiscussionsState>(STORAGE_KEY, {
    customThreads: [],
    customReplies: [],
    deletedMockThreadIds: [],
  });
  return {
    customThreads: Array.isArray(parsed.customThreads) ? parsed.customThreads : [],
    customReplies: Array.isArray(parsed.customReplies) ? parsed.customReplies : [],
    deletedMockThreadIds: Array.isArray(parsed.deletedMockThreadIds)
      ? parsed.deletedMockThreadIds
      : [],
  };
}

function mergeData() {
  const state = loadState();
  const deleted = new Set(state.deletedMockThreadIds);
  const threadMap = new Map<string, DiscussionThread>();

  for (const mock of SEED_THREADS) {
    if (!deleted.has(mock.id)) threadMap.set(mock.id, { ...mock });
  }
  for (const custom of state.customThreads) {
    threadMap.set(custom.id, custom);
  }

  threads = [...threadMap.values()].sort(
    (a, b) => discussionPopularityScore(b) - discussionPopularityScore(a)
  );

  const replyMap = new Map<string, DiscussionReply>();
  for (const mock of SEED_REPLIES) {
    if (!deleted.has(mock.thread_id)) replyMap.set(mock.id, mock);
  }
  for (const custom of state.customReplies) {
    replyMap.set(custom.id, custom);
  }
  replies = [...replyMap.values()];
  syncReplyCounts();
}

function ensureLoaded() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  mergeData();
}

export function buildDiscussionsPersistState(): DiscussionsState {
  ensureLoaded();
  const currentIds = new Set(threads.map((t) => t.id));
  return {
    customThreads: threads.filter((t) => !MOCK_THREAD_IDS.has(t.id)),
    customReplies: replies.filter((r) => !SEED_REPLY_IDS.has(r.id)),
    deletedMockThreadIds: SEED_THREADS.filter((t) => !currentIds.has(t.id)).map((t) => t.id),
  };
}

export function applyDiscussionsPersistState(state: DiscussionsState): void {
  if (typeof window === "undefined") return;
  writeJson(STORAGE_KEY, {
    customThreads: Array.isArray(state.customThreads) ? state.customThreads : [],
    customReplies: Array.isArray(state.customReplies) ? state.customReplies : [],
    deletedMockThreadIds: Array.isArray(state.deletedMockThreadIds)
      ? state.deletedMockThreadIds
      : [],
  });
  storageLoaded = false;
  threads = [];
  replies = [];
  ensureLoaded();
  notify();
}

export async function syncDiscussionsToServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { pushDiscussionsPlatformState } = await import("@/lib/content-sync");
  return pushDiscussionsPlatformState(buildDiscussionsPersistState());
}

function persist() {
  if (typeof window === "undefined") return;
  ensureLoaded();
  const state = buildDiscussionsPersistState();
  writeJson(STORAGE_KEY, state);
  scheduleDiscussionsPlatformPush(state);
}

function syncReplyCounts() {
  for (const thread of threads) {
    thread.reply_count = replies.filter((r) => r.thread_id === thread.id).length;
  }
}

export function subscribeDiscussions(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAllDiscussionThreads(): DiscussionThread[] {
  ensureLoaded();
  return [...threads].sort(
    (a, b) => discussionPopularityScore(b) - discussionPopularityScore(a)
  );
}

export function getDiscussionThread(id: string): DiscussionThread | undefined {
  ensureLoaded();
  return threads.find((t) => t.id === id);
}

export function getDiscussionReplies(threadId: string): DiscussionReply[] {
  ensureLoaded();
  return replies
    .filter((r) => r.thread_id === threadId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function recordDiscussionView(threadId: string): void {
  ensureLoaded();
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return;
  thread.views += 1;
  if (!MOCK_THREAD_IDS.has(threadId)) persist();
  notify();
}

export interface NewDiscussionInput {
  title: string;
  body: string;
  author_username: string;
  author_display_name: string;
  category: string;
  tags: string[];
}

export function createDiscussionThread(input: NewDiscussionInput): DiscussionThread {
  ensureLoaded();
  const now = new Date().toISOString();
  const thread: DiscussionThread = {
    id: `d-${Date.now()}`,
    title: input.title.trim(),
    body: input.body.trim(),
    author_username: input.author_username.toLowerCase(),
    author_display_name: input.author_display_name,
    category: normalizeDiscussionCategory(input.category),
    tags: normalizeDiscussionTagList(input.tags),
    reply_count: 0,
    views: 0,
    created_at: now,
    last_activity_at: now,
  };
  threads = [thread, ...threads];
  persist();
  notify();
  return thread;
}

export function addDiscussionReply(input: {
  thread_id: string;
  author_username: string;
  author_display_name: string;
  body: string;
}): DiscussionReply | null {
  ensureLoaded();
  const thread = threads.find((t) => t.id === input.thread_id);
  if (!thread) return null;

  const reply: DiscussionReply = {
    id: `dr-${Date.now()}`,
    thread_id: input.thread_id,
    author_username: input.author_username.toLowerCase(),
    author_display_name: input.author_display_name,
    body: input.body.trim(),
    created_at: new Date().toISOString(),
  };
  replies.push(reply);
  thread.reply_count += 1;
  thread.last_activity_at = reply.created_at;
  persist();
  notify();
  void syncDiscussionsToServer();
  return reply;
}

export function collectDiscussionTags(threadList: DiscussionThread[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const thread of threadList) {
    for (const tag of thread.tags) {
      const key = tag.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(tag);
      }
    }
  }
  return out.sort();
}
