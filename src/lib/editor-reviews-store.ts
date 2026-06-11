import type { EditorReviewRecord } from "@/types/database";

export const MOCK_EDITOR_REVIEWS: EditorReviewRecord[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeEditorReviews(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAllEditorReviews(): EditorReviewRecord[] {
  return [...MOCK_EDITOR_REVIEWS].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function addEditorReview(
  record: Omit<EditorReviewRecord, "id" | "created_at">
): EditorReviewRecord {
  const entry: EditorReviewRecord = {
    ...record,
    id: `er-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  MOCK_EDITOR_REVIEWS.unshift(entry);
  notify();
  return entry;
}
