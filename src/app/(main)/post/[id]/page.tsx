import { Suspense } from "react";
import { PostPageClient } from "@/components/content/PostPageClient";

export default function PostPage() {
  return (
    <Suspense
      fallback={
        <div className="comic-panel p-8 text-center font-comic text-ink-muted">
          Loading post…
        </div>
      }
    >
      <PostPageClient />
    </Suspense>
  );
}
