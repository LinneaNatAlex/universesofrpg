import Link from "next/link";
import { MessageCircle, Code2, BookOpen, UserCircle, Lock } from "lucide-react";
import { LikeButton } from "@/components/feed/LikeButton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { FeedPost } from "@/types/database";

const TYPE_ICONS = {
  character_sheet: UserCircle,
  code_template: Code2,
  story_segment: BookOpen,
  digital_asset: UserCircle,
  collab_thread: MessageCircle,
};

const TYPE_LABELS = {
  character_sheet: "Character",
  code_template: "Template",
  story_segment: "Story",
  digital_asset: "Asset",
  collab_thread: "Collab",
};

interface FeedCardProps {
  post: FeedPost;
}

export function FeedCard({ post }: FeedCardProps) {
  const Icon = TYPE_ICONS[post.type];

  return (
    <Card className="overflow-hidden hover:border-violet-500/40 transition-colors">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/40 to-cyan-500/40 border border-violet-500/30 text-sm font-bold text-violet-200">
              {post.author.display_name.charAt(0)}
            </div>
            <div>
              <Link
                href={`/profile/${post.author.username}`}
                className="font-medium text-foreground hover:text-violet-300 transition-colors"
              >
                {post.author.display_name}
              </Link>
              <p className="text-xs text-muted">@{post.author.username}</p>
            </div>
          </div>
          <Badge variant="default">
            <Icon className="h-3 w-3 mr-1 inline" />
            {TYPE_LABELS[post.type]}
          </Badge>
        </div>

        <Link href={`/post/${post.id}`} className="block mt-4 group">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-violet-300 transition-colors">
            {post.title}
          </h3>
          {post.description && (
            <p className="mt-1 text-sm text-muted line-clamp-2">{post.description}</p>
          )}
        </Link>

        {(post.html_code || post.content) && (
          <div className="mt-4 rounded-lg border border-border bg-background/60 p-3 font-mono text-xs text-muted overflow-hidden">
            <pre className="line-clamp-3 whitespace-pre-wrap">
              {post.html_code ?? post.content}
            </pre>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {post.pricing === "free" ? (
            <Badge variant="free">Free</Badge>
          ) : (
            <Badge variant="paid">{formatPrice(post.price_cents)}</Badge>
          )}
          {post.is_code_locked && (
            <Badge variant="tag">
              <Lock className="h-3 w-3 mr-1 inline" />
              Locked code
            </Badge>
          )}
          {post.style_tags.map((tag) => (
            <Badge key={tag} variant="tag">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted">
          <LikeButton postId={post.id} initialCount={post.like_count} />
          <span className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {post.comment_count}
          </span>
        </div>
      </div>
    </Card>
  );
}
