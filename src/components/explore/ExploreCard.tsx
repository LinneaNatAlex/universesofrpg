import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PostCoverThumbnail } from "@/components/content/PostCoverThumbnail";
import { getPostTags } from "@/lib/post-tags";
import type { FeedPost } from "@/types/database";

interface ExploreCardProps {
  post: FeedPost;
}

export function ExploreCard({ post }: ExploreCardProps) {
  const tags = getPostTags(post);

  return (
    <Link href={`/post/${post.id}`} className="comic-card block p-4 hover:no-underline group">
      <div className="flex gap-3">
        <PostCoverThumbnail post={post} size="sm" coverOnly />
        <div className="min-w-0 flex-1">
          <Badge variant="free" className="mb-1.5 text-[10px]">
            Free · sign up to read
          </Badge>
          <h3 className="font-comic text-base text-ink group-hover:text-comic-red leading-tight">
            {post.title}
          </h3>
          <p className="text-[11px] text-ink-muted mt-0.5">
            by {post.author.display_name}
          </p>
          <p className="text-xs text-ink-muted italic mt-1.5 line-clamp-2">
            {post.plot_synopsis ?? post.description}
          </p>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-comic px-1.5 py-0.5 border border-ink bg-surface text-ink-muted"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
