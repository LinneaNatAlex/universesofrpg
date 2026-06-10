import type { Comment } from "@/types/database";

export const MOCK_COMMENTS: Comment[] = [
  {
    id: "c1",
    post_id: "1",
    author_id: "u2",
    author_username: "roninforge",
    author_display_name: "Ronin Forge",
    body: "Love the rune borders — would work great on a cyber-fantasy sheet too.",
    created_at: "2026-06-08T14:22:00Z",
  },
  {
    id: "c2",
    post_id: "1",
    author_id: "u3",
    author_username: "hollowscribe",
    author_display_name: "Hollow Scribe",
    body: "Forked this for my horror campaign profile. The inventory tab idea is chef's kiss.",
    created_at: "2026-06-09T09:10:00Z",
  },
  {
    id: "c3",
    post_id: "3",
    author_id: "u1",
    author_username: "lyra_weaver",
    author_display_name: "Lyra Moonwhisper",
    body: "The gate breathing line gave me chills. Ready for turn 13 whenever you are.",
    created_at: "2026-06-07T18:45:00Z",
  },
  {
    id: "c4",
    post_id: "3",
    author_id: "u2",
    author_username: "roninforge",
    author_display_name: "Ronin Forge",
    body: "This synopsis alone sold me — signing up to read the full thread.",
    created_at: "2026-06-08T11:30:00Z",
  },
  {
    id: "c5",
    post_id: "4",
    author_id: "u3",
    author_username: "hollowscribe",
    author_display_name: "Hollow Scribe",
    body: "Epistolary fantasy is underrated. The margin voice tease in the synopsis is perfect.",
    created_at: "2026-06-09T16:00:00Z",
  },
];

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeComments(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((l) => l());
}

export function getCommentsForPost(postId: string): Comment[] {
  return MOCK_COMMENTS.filter((c) => c.post_id === postId).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export function getCommentCount(postId: string): number {
  return MOCK_COMMENTS.filter((c) => c.post_id === postId).length;
}

export function addComment(comment: Comment): void {
  MOCK_COMMENTS.push(comment);
  notify();
}

export function getAllComments(): Comment[] {
  return [...MOCK_COMMENTS].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function deleteComment(id: string): boolean {
  const idx = MOCK_COMMENTS.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  MOCK_COMMENTS.splice(idx, 1);
  notify();
  return true;
}
