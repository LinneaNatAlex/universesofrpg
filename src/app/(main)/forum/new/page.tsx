import { Suspense } from "react";
import { NewForumForm } from "@/components/forum/ForumStudio";

export default function NewForumPage() {
  return (
    <Suspense
      fallback={
        <div className="comic-panel p-8 text-center font-comic text-ink-muted">
          Loading…
        </div>
      }
    >
      <NewForumForm />
    </Suspense>
  );
}
