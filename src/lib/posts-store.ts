import { MOCK_FEED } from "@/lib/mock-data";
import type { FeedPost, ModerationStatus } from "@/types/database";

let posts: FeedPost[] = [...MOCK_FEED];

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribePosts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAllPosts(): FeedPost[] {
  return [...posts];
}

export function getPostFromStore(id: string): FeedPost | undefined {
  return posts.find((p) => p.id === id);
}

export function deletePost(id: string): boolean {
  const before = posts.length;
  posts = posts.filter((p) => p.id !== id);
  if (posts.length < before) {
    notify();
    return true;
  }
  return false;
}

export function setPostModeration(id: string, status: ModerationStatus): boolean {
  const post = posts.find((p) => p.id === id);
  if (!post) return false;
  post.moderation_status = status;
  notify();
  return true;
}

export type NewPostInput = Omit<
  FeedPost,
  "id" | "created_at" | "like_count" | "comment_count"
>;

export function addPost(input: NewPostInput): FeedPost {
  const post: FeedPost = {
    ...input,
    id: `post-${Date.now()}`,
    created_at: new Date().toISOString(),
    like_count: 0,
    comment_count: 0,
  };
  posts = [post, ...posts];
  notify();
  return post;
}
