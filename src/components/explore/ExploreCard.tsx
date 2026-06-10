import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { FeedPost } from "@/types/database";
import { Compass } from "lucide-react";

interface ExploreCardProps {
  post: FeedPost;
}

export function ExploreCard({ post }: ExploreCardProps) {
  return (
    <Link href={`/post/${post.id}`} className="comic-card block p-4 hover:no-underline group">
      <div className="flex gap-3">
        {post.book_cover_url ? (
          <div className="comic-cover shrink-0">
            <Image
              src={post.book_cover_url}
              alt=""
              width={56}
              height={78}
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-14 h-[4.5rem] shrink-0 border-2 border-ink bg-comic-yellow/30 flex items-center justify-center">
            <Compass className="h-5 w-5 text-ink-muted opacity-50" />
          </div>
        )}
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
          <div className="mt-2 flex flex-wrap gap-1">
            {[...post.tags, ...post.style_tags].slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[10px] font-comic px-1.5 py-0.5 border border-ink bg-surface text-ink-muted"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
