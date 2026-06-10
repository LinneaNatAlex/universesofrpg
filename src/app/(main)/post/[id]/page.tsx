import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostById } from "@/lib/posts";
import { PostView } from "@/components/content/PostView";
import { ArrowLeft } from "lucide-react";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const post = getPostById(id);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-comic text-ink-muted hover:text-comic-red"
      >
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>
      <Suspense fallback={<div className="comic-panel p-8 text-center font-comic">Loading…</div>}>
        <PostView post={post} />
      </Suspense>
    </div>
  );
}
