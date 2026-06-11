"use client";

import Link from "next/link";
import { EditorGuard } from "@/components/editor/EditorGuard";
import { EditorReviewQueue } from "@/components/editor/EditorReviewQueue";
import { useEffect, useState } from "react";
import { getAllEditorReviews, subscribeEditorReviews } from "@/lib/editor-reviews-store";
import type { EditorReviewRecord } from "@/types/database";
import { EditorBadge } from "@/components/editor/EditorBadge";

function AuditLog() {
  const [reviews, setReviews] = useState<EditorReviewRecord[]>([]);

  useEffect(() => {
    const refresh = () => setReviews(getAllEditorReviews().slice(0, 10));
    refresh();
    return subscribeEditorReviews(refresh);
  }, []);

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-ink-muted italic text-center py-4">No reviews logged yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {reviews.map((r) => (
        <li key={r.id} className="text-xs border-l-4 border-comic-blue pl-3 py-1">
          <span className="font-comic text-ink">{r.post_title}</span>
          <span className="text-ink-muted"> — {r.decision} by </span>
          <EditorBadge level={r.editor_level} compact />
          <span className="text-ink-muted block mt-0.5">
            @{r.editor_username} · {new Date(r.created_at).toLocaleDateString()}
          </span>
          {r.feedback && <p className="text-ink-muted italic mt-1">{r.feedback}</p>}
        </li>
      ))}
    </ul>
  );
}

export default function EditorPortalPage() {
  return (
    <EditorGuard>
      <div className="space-y-8 max-w-3xl mx-auto">
        <header>
          <h1 className="font-comic text-3xl text-ink">Editor Portal</h1>
          <p className="text-sm text-ink-muted mt-1">
            Review paid Shop submissions. Free content is auto-approved on publish.
          </p>
          <p className="text-xs text-ink-muted mt-2">
            Editors are independent contractors. Platform commission and tax responsibilities
            apply — see{" "}
            <Link href="/rights" className="text-comic-red hover:underline">
              Rights &amp; Terms
            </Link>
            .
          </p>
        </header>

        <EditorReviewQueue />

        <section className="comic-panel p-5">
          <h2 className="font-comic text-lg text-ink border-b-2 border-dashed border-ink pb-2 mb-3">
            Recent audit log
          </h2>
          <p className="text-xs text-ink-muted mb-3">
            All editor decisions are recorded. Admins can override at any time.
          </p>
          <AuditLog />
        </section>
      </div>
    </EditorGuard>
  );
}
