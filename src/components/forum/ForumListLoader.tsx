"use client";

import dynamic from "next/dynamic";

function ForumListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy aria-label="Loading RPG topics">
      <div className="flex items-center justify-between gap-3">
        <div className="h-9 w-40 bg-ink/10 rounded" />
        <div className="h-9 w-28 bg-ink/10 rounded" />
      </div>
      <div className="h-10 w-full bg-ink/10 rounded" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="comic-card h-36 bg-ink/5" />
        ))}
      </div>
    </div>
  );
}

export const ForumListLoader = dynamic(
  () => import("@/components/forum/ForumStudio").then((m) => m.ForumList),
  { loading: () => <ForumListSkeleton /> }
);
