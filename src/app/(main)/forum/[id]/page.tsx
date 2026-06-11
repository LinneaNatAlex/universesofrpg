import { Suspense } from "react";
import { ForumDetail } from "@/components/forum/ForumStudio";

interface ForumDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ForumDetailPage({ params }: ForumDetailPageProps) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="comic-panel p-8 text-center font-comic text-ink-muted">
          Loading topic…
        </div>
      }
    >
      <ForumDetail forumId={id} />
    </Suspense>
  );
}
