export interface Report {
  id: string;
  post_id: string | null;
  post_title: string;
  reporter_username: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
}

export const MOCK_REPORTS: Report[] = [
  {
    id: "r1",
    post_id: "2",
    post_title: "Kael — Cyber Ronin Sheet",
    reporter_username: "hollowscribe",
    reason: "Suspected stolen character art in preview.",
    status: "open",
    created_at: "2026-06-09T10:00:00Z",
  },
  {
    id: "r2",
    post_id: "5",
    post_title: "Ronin Portrait Pack",
    reporter_username: "lyra_weaver",
    reason: "AI-generated avatars not labeled.",
    status: "open",
    created_at: "2026-06-10T08:30:00Z",
  },
];

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeReports(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAllReports(): Report[] {
  return [...MOCK_REPORTS];
}

export function resolveReport(id: string, status: "resolved" | "dismissed"): void {
  const r = MOCK_REPORTS.find((x) => x.id === id);
  if (r) {
    r.status = status;
    notify();
  }
}
